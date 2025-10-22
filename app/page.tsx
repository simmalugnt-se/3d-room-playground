import ModelTest2 from "./components/ModelTest2";
export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="w-full h-screen max-w-screen max-h-screen flex items-center justify-center">
        <div className="aspect-square w-full max-w-[80vh] h-auto">
          <ModelTest2 />
        </div>
      </div>
    </div>
  );
}
