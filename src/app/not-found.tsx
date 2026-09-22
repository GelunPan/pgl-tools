import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-8">
        <h1 className="text-7xl font-black tracking-tight mb-4">404</h1>
        <p className="text-muted-foreground mb-8">
          你要找的页面不存在，或者已经被移走了。
        </p>
        <Button asChild className="rounded-full">
          <Link href="/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回登录页
          </Link>
        </Button>
      </div>
    </div>
  );
}
