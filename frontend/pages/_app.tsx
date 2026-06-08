import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { AppProps } from "next/app";
import "../src/styles/index.css";
import { Layout } from "../src/app/components/Layout";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = Boolean(localStorage.getItem("userType"));
    setIsAuthenticated(auth);
    setCheckedAuth(true);

    if (!auth && router.pathname !== "/login") {
      router.replace("/login");
      return;
    }

    if (auth && router.pathname === "/login") {
      router.replace("/");
    }
  }, [router.pathname]);

  if (!checkedAuth) {
    return null;
  }

  if (router.pathname === "/login") {
    return <Component {...pageProps} />;
  }

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
