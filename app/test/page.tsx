import { redirect } from "next/navigation";
export default function TestPage() { 
  redirect('/auth');
  return <div>Test</div>; 
}
