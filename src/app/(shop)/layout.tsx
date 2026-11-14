import { Header, Footer } from "@/components/Header";
export default function Shop({ children }: { children: React.ReactNode }) {
  return (<><Header /><main id="main">{children}</main><Footer /></>);
}
