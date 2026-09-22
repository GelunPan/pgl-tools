"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const SESSION_KEY = "careercompass_session";

type Session = {
  email: string;
  name: string;
  role: string;
  loginAt: string;
};

export default function WelcomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        setSession(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    toast({
      title: "已退出登录",
      description: "期待你的下次访问。",
    });
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-8">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">欢迎</h1>
        <p className="text-muted-foreground text-lg mb-2">
          登录成功，这是一个空白测试页面。
        </p>
        {session && (
          <div className="mt-6 p-4 rounded-xl bg-muted/50 text-left space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">姓名：</span>
              <span className="font-medium">{session.name}</span>
            </p>
            <p>
              <span className="text-muted-foreground">邮箱：</span>
              <span className="font-medium">{session.email}</span>
            </p>
            <p>
              <span className="text-muted-foreground">角色：</span>
              <span className="font-medium">
                {session.role === "employer" ? "高手" : "新手"}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">登录时间：</span>
              <span className="font-medium">
                {new Date(session.loginAt).toLocaleString("zh-CN")}
              </span>
            </p>
          </div>
        )}
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button onClick={handleLogout} variant="outline" className="rounded-full">
            退出登录
          </Button>
          <Button
            onClick={() => router.push("/login")}
            className="rounded-full"
          >
            返回登录页
          </Button>
        </div>
      </div>
    </div>
  );
}
