import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { AppProps } from "next/app";
import "../src/styles/index.css";
import { Layout } from "../src/app/components/Layout";

function getValidDashboardAuth() {
  const auth = localStorage.getItem("woofAuth") === "true";
  const token = localStorage.getItem("woofAuthToken");
  const expiresAt = localStorage.getItem("woofAuthExpiresAt");
  const expiresAtTime = expiresAt ? Date.parse(expiresAt) : Number.NaN;

  if (auth && token && Number.isFinite(expiresAtTime) && expiresAtTime > Date.now()) {
    return true;
  }

  localStorage.removeItem("woofAuth");
  localStorage.removeItem("woofAuthToken");
  localStorage.removeItem("woofAuthExpiresAt");
  localStorage.removeItem("userType");
  localStorage.removeItem("userEmail");
  return false;
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = getValidDashboardAuth();
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

  if (!isAuthenticated && router.pathname !== "/login") {
    return null;
  }

  if (isAuthenticated && router.pathname === "/login") {
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
