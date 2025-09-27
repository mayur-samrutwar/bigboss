import "@/styles/globals.css";
import { AppKitProvider } from "../components/AppKitProvider";

export default function App({ Component, pageProps }) {
  return (
    <AppKitProvider cookies={null}>
      <Component {...pageProps} />
    </AppKitProvider>
  );
}
