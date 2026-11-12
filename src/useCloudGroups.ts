import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { googleProviderEnabled, initialAuthReturn, supabase } from "./supabase";
import {
  parseSnapshot,
  snapshotFingerprint,
  type CourtSnapshot,
} from "./snapshot";
import { buildInviteUrl } from "./invites";
import { authErrorMessage } from "./authErrors";
import {
  clearAuthDraft,
  cleanAuthCallback,
  keepAuthDraft,
  takeAuthDraft,
} from "./authRedirect";

export type SavedGroup = {
  id: string;
  name: string;
  revision: number;
  updated_at: string;
  player_count: number;
  completed_games: number;
};
const columns = "id,name,revision,updated_at,player_count,completed_games";

export function useCloudGroups(options: {
  snapshot: CourtSnapshot | null;
  onLoad: (value: CourtSnapshot) => void;
  onAccountClosed: () => void;
  onAuthReturn: () => void;
  notify: (message: string) => void;
}) {
  const latest = useRef(options);
  latest.current = options;
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [busy, setBusy] = useState<
    "save" | "open" | "email" | "google" | "logout" | "invite" | "revoke" | null
  >(null);
  const locked = useRef(false);
  const account = useRef<string | null>(null);
  const generation = useRef(0);
  const listRequest = useRef(0);
  const draftId = useRef(crypto.randomUUID());
  const [groups, setGroups] = useState<SavedGroup[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [attached, setAttached] = useState<SavedGroup | null>(null);
  const [baseline, setBaseline] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [authError, setAuthError] = useState("");
  const [resendAt, setResendAt] = useState(0);
  const [googleStatus, setGoogleStatus] = useState<
    "checking" | "enabled" | "disabled" | "error"
  >("checking");
  const returnDraft = useRef<ReturnType<typeof takeAuthDraft> | undefined>(
    undefined,
  );
  const restoredDraft = useRef(false);
  const [invite, setInvite] = useState<{
    url: string;
    expiresAt: string;
  } | null>(null);
  const dirty = Boolean(
    options.snapshot && snapshotFingerprint(options.snapshot) !== baseline,
  );
  const detach = () => {
    setAttached(null);
    setBaseline("");
    setInvite(null);
    draftId.current = crypto.randomUUID();
  };
  const notify = (message: string) => latest.current.notify(message);

  const checkGoogle = async (signal?: AbortSignal) => {
    setGoogleStatus("checking");
    try {
      const enabled = await googleProviderEnabled(signal);
      if (!signal?.aborted) setGoogleStatus(enabled ? "enabled" : "disabled");
      return enabled;
    } catch {
      if (!signal?.aborted) setGoogleStatus("error");
      return false;
    }
  };
  useEffect(() => {
    if (!supabase) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      setGoogleStatus("error");
    }, 10000);
    void checkGoogle(controller.signal).finally(() => clearTimeout(timeout));
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const resumed = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      locked.current = false;
      setBusy(null);
      try {
        clearAuthDraft(sessionStorage);
      } catch {
        /* Storage may be blocked. */
      }
    };
    window.addEventListener("pageshow", resumed);
    return () => window.removeEventListener("pageshow", resumed);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let live = true;
    if (returnDraft.current === undefined) {
      try {
        returnDraft.current = takeAuthDraft(sessionStorage);
      } catch {
        returnDraft.current = null;
      }
    }
    if (returnDraft.current?.snapshot && !restoredDraft.current) {
      restoredDraft.current = true;
      latest.current.onLoad(returnDraft.current.snapshot);
    }
    const applyUser = (next: User | null) => {
      if (!live) return;
      if (account.current !== (next?.id ?? null)) {
        const previous = account.current;
        account.current = next?.id ?? null;
        generation.current++;
        listRequest.current++;
        setGroups([]);
        setHasMore(false);
        setListError("");
        detach();
        if (previous) {
          latest.current.onAccountClosed();
          notify("ออกจากบัญชีเดิมแล้ว ข้อมูลที่บันทึกออนไลน์ยังอยู่");
        }
      }
      setUser(next);
      setAuthLoading(false);
    };
    // The auth callback remains synchronous to avoid holding Supabase's auth lock.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) =>
      applyUser(session?.user ?? null),
    );
    void (async () => {
      try {
        const initialized = await supabase.auth.initialize();
        const { data, error } = await supabase.auth.getSession();
        if (!live) return;
        applyUser(data.session?.user ?? null);
        const failure = initialAuthReturn.error
          ? { code: initialAuthReturn.error }
          : initialized.error || error;
        const returning =
          initialAuthReturn.returning || Boolean(returnDraft.current);
        if (failure || (returning && !data.session)) {
          setAuthError(authErrorMessage(failure));
        } else if (returning && data.session) {
          setAuthError("");
          notify("เข้าสู่ระบบสำเร็จ กดบันทึกเพื่อเก็บก๊วนออนไลน์ได้เลย");
        }
        if (returning || failure) latest.current.onAuthReturn();
        if (initialAuthReturn.returning)
          window.history.replaceState(
            null,
            "",
            cleanAuthCallback(location.href),
          );
      } catch {
        if (live) {
          setAuthLoading(false);
          setAuthError(authErrorMessage(null));
          latest.current.onAuthReturn();
        }
      }
    })();
    return () => {
      live = false;
      subscription.unsubscribe();
    };
  }, []);

  const refresh = async (more = false) => {
    const owner = account.current;
    if (!supabase || !owner) return;
    const request = ++listRequest.current;
    const offset = more ? groups.length : 0;
    setListLoading(true);
    setListError("");
    try {
      const { data, error } = await supabase
        .from("courtmate_groups")
        .select(columns)
        .eq("owner_id", owner)
        .order("updated_at", { ascending: false })
        .order("id")
        .range(offset, offset + 19)
        .abortSignal(AbortSignal.timeout(15000));
      if (request !== listRequest.current || owner !== account.current) return;
      if (error) throw error;
      const rows = data as SavedGroup[];
      setGroups((old) =>
        more
          ? [
              ...old,
              ...rows.filter((row) => !old.some((item) => item.id === row.id)),
            ]
          : rows,
      );
      setHasMore(rows.length === 20);
    } catch {
      if (request === listRequest.current)
        setListError("โหลดก๊วนไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วลองอีกครั้ง");
    } finally {
      if (request === listRequest.current) setListLoading(false);
    }
  };
  useEffect(() => {
    if (user) void refresh();
  }, [user?.id]);
  useEffect(() => {
    if (!user || !dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [user?.id, dirty]);

  const save = async () => {
    const owner = account.current;
    if (!supabase || !owner || !latest.current.snapshot || locked.current)
      return false;
    locked.current = true;
    setBusy("save");
    const epoch = generation.current;
    try {
      let snapshot: CourtSnapshot;
      try {
        snapshot = parseSnapshot(latest.current.snapshot);
      } catch (error) {
        notify((error as Error).message);
        return false;
      }
      let saved: SavedGroup;
      if (attached) {
        const { data, error } = await supabase
          .from("courtmate_groups")
          .update({ name: snapshot.groupName, snapshot })
          .eq("id", attached.id)
          .eq("owner_id", owner)
          .eq("revision", attached.revision)
          .select(columns)
          .abortSignal(AbortSignal.timeout(15000))
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          notify(
            "ก๊วนนี้ถูกแก้จากเครื่องอื่นแล้ว กรุณาเปิดข้อมูลล่าสุดก่อนบันทึกอีกครั้ง",
          );
          return false;
        }
        saved = data as SavedGroup;
      } else {
        const { data, error } = await supabase
          .from("courtmate_groups")
          .insert({
            id: draftId.current,
            owner_id: owner,
            name: snapshot.groupName,
            snapshot,
          })
          .select(columns)
          .abortSignal(AbortSignal.timeout(15000))
          .single();
        if (error) {
          // A response can be lost after the insert commits. Reuse the draft id on retry.
          const { data: existing } = await supabase
            .from("courtmate_groups")
            .select(`${columns},snapshot`)
            .eq("id", draftId.current)
            .eq("owner_id", owner)
            .abortSignal(AbortSignal.timeout(10000))
            .maybeSingle();
          if (!existing) throw error;
          if (
            snapshotFingerprint(parseSnapshot(existing.snapshot)) !==
            snapshotFingerprint(snapshot)
          ) {
            notify(
              "ก๊วนนี้บันทึกไว้แล้ว กรุณาเปิดข้อมูลล่าสุดก่อนบันทึกอีกครั้ง",
            );
            void refresh();
            return false;
          }
          const { snapshot: _snapshot, ...meta } = existing;
          saved = meta as SavedGroup;
        } else saved = data as SavedGroup;
      }
      if (epoch !== generation.current) return false;
      setAttached(saved);
      setBaseline(snapshotFingerprint(snapshot));
      notify("บันทึกก๊วนออนไลน์สำเร็จ เปิดต่อจากเครื่องอื่นได้แล้ว");
      void refresh();
      return saved;
    } catch (error) {
      if (epoch === generation.current)
        notify(
          "บันทึกไม่สำเร็จ ข้อมูลบนหน้านี้ยังอยู่ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่",
        );
      return false;
    } finally {
      locked.current = false;
      setBusy(null);
    }
  };
  const open = async (id: string) => {
    const owner = account.current;
    if (!supabase || !owner || locked.current) return false;
    locked.current = true;
    setBusy("open");
    const epoch = generation.current;
    try {
      const { data, error } = await supabase
        .from("courtmate_groups")
        .select(`${columns},snapshot`)
        .eq("id", id)
        .eq("owner_id", owner)
        .abortSignal(AbortSignal.timeout(15000))
        .single();
      if (error) throw error;
      const snapshot = parseSnapshot(data.snapshot);
      if (epoch !== generation.current) return false;
      latest.current.onLoad(snapshot);
      setInvite(null);
      const { snapshot: _snapshot, ...meta } = data;
      setAttached(meta as SavedGroup);
      setBaseline(snapshotFingerprint(snapshot));
      notify("เปิดก๊วนที่บันทึกไว้สำเร็จ");
      return true;
    } catch {
      if (epoch === generation.current)
        notify("เปิดก๊วนไม่สำเร็จ กรุณาลองใหม่ ข้อมูลบนหน้านี้ยังอยู่");
      return false;
    } finally {
      locked.current = false;
      setBusy(null);
    }
  };
  const sendLink = async (email: string) => {
    if (!supabase || locked.current || Date.now() < resendAt) return;
    locked.current = true;
    setBusy("email");
    setAuthError("");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${location.origin}${location.pathname}` },
      });
      if (error) throw error;
      setEmailSent(true);
      setResendAt(Date.now() + 60000);
      notify("ส่งลิงก์เข้าสู่ระบบแล้ว ตรวจอีเมลและโฟลเดอร์สแปม");
    } catch (error) {
      const message = authErrorMessage(error);
      setAuthError(message);
      notify(message);
    } finally {
      locked.current = false;
      setBusy(null);
    }
  };
  const signInGoogle = async () => {
    if (!supabase || locked.current || account.current) return;
    locked.current = true;
    setBusy("google");
    setAuthError("");
    let navigating = false;
    try {
      if (!(await checkGoogle())) {
        setAuthError(
          "Google ยังไม่พร้อมใช้งาน ลองตรวจความพร้อมอีกครั้งหรือติดต่อผู้ดูแล",
        );
        return;
      }
      try {
        keepAuthDraft(sessionStorage, latest.current.snapshot);
      } catch {
        setAuthError(
          "เบราว์เซอร์นี้เก็บก๊วนชั่วคราวไม่ได้ กรุณาเปิดใน Chrome หรือ Safari แล้วลองใหม่",
        );
        return;
      }
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${location.origin}${location.pathname}`,
          scopes: "openid email profile",
          queryParams: { prompt: "select_account" },
          skipBrowserRedirect: true,
        },
      });
      if (error || !data.url) throw error;
      location.assign(data.url);
      navigating = true;
    } catch (error) {
      try {
        clearAuthDraft(sessionStorage);
      } catch {
        /* Storage may be blocked. */
      }
      setAuthError(authErrorMessage(error));
    } finally {
      if (!navigating) {
        locked.current = false;
        setBusy(null);
      }
    }
  };
  const logout = async () => {
    if (!supabase || locked.current) return;
    locked.current = true;
    setBusy("logout");
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
    } catch {
      notify("ออกจากระบบไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      locked.current = false;
      setBusy(null);
    }
  };
  const createInvitation = async () => {
    if (!supabase || !account.current || locked.current) return;
    const saved = attached && !dirty ? attached : await save();
    if (!saved || locked.current || !account.current) return;
    const epoch = generation.current;
    locked.current = true;
    setBusy("invite");
    setInvite(null);
    try {
      const token = Array.from(
        crypto.getRandomValues(new Uint8Array(32)),
        (n) => n.toString(16).padStart(2, "0"),
      ).join("");
      const { data, error } = await supabase
        .rpc("courtmate_publish_invite", {
          p_group_id: saved.id,
          p_token: token,
        })
        .abortSignal(AbortSignal.timeout(15000));
      if (
        error ||
        !data ||
        typeof data.expires_at !== "string" ||
        !Number.isFinite(Date.parse(data.expires_at))
      )
        throw new Error("invite");
      if (epoch !== generation.current) return;
      setInvite({
        url: buildInviteUrl(`${location.origin}${location.pathname}`, {
          groupId: saved.id,
          token,
        }),
        expiresAt: data.expires_at,
      });
      notify("สร้างลิงก์เชิญสำเร็จ ใช้งานได้ 7 วัน");
    } catch {
      if (epoch === generation.current)
        notify("สร้างลิงก์ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      locked.current = false;
      setBusy(null);
    }
  };
  const revokeInvitation = async () => {
    if (!supabase || !account.current || !attached || locked.current) return;
    const epoch = generation.current;
    locked.current = true;
    setBusy("revoke");
    try {
      const { error } = await supabase
        .rpc("courtmate_revoke_invite", { p_group_id: attached.id })
        .abortSignal(AbortSignal.timeout(15000));
      if (error) throw error;
      if (epoch !== generation.current) return;
      setInvite(null);
      notify("ปิดลิงก์เชิญของก๊วนนี้แล้ว");
    } catch {
      if (epoch === generation.current)
        notify("ปิดลิงก์ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      locked.current = false;
      setBusy(null);
    }
  };
  return {
    ready: Boolean(supabase),
    user,
    authLoading,
    busy,
    groups,
    listLoading,
    listError,
    hasMore,
    attached,
    dirty,
    emailSent,
    authError,
    resendAt,
    refresh,
    save,
    open,
    sendLink,
    signInGoogle,
    googleStatus,
    checkGoogle,
    logout,
    detach,
    invite,
    createInvitation,
    revokeInvitation,
  };
}
