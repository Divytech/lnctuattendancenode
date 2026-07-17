import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "LNCTU Sync",
  description: "Fast, sleek attendance and result tracker.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-gray-100 flex flex-col relative overflow-x-hidden selection:bg-purple-500/30">
        <Script id="anti-dev-tools" strategy="afterInteractive">
          {`
            var tryCount = 0;
            var minimalUserResponseInMiliseconds = 200;
            function check() { 
                console.clear();
                var before = new Date().getTime();
                debugger;
                var after = new Date().getTime();
                if (after - before > minimalUserResponseInMiliseconds) { 
                    document.write(" Dont open Developer Tools. ");
                    self.location.replace(
                        window.location.protocol + window.location.href.substring(
                            window.location.protocol.length
                        )
                    );  
                }
                setTimeout(check, 100);
            }
            check();
            window.addEventListener('load', function () { 
                document.addEventListener("contextmenu", function (e) { 
                    e.preventDefault();
                }, false);
                document.addEventListener("keydown", function (e) {
                    // Ctrl+Shift+I 
                    if (e.ctrlKey && e.shiftKey && e.keyCode == 73) { 
                        disabledEvent(e);
                    }
                    // Ctrl+Shift+J 
                    if (e.ctrlKey && e.shiftKey && e.keyCode == 74) { 
                        disabledEvent(e);
                    } 
                    // Ctrl+S 
                    if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) { 
                        disabledEvent(e);
                    }
                    // Ctrl + U 
                    if (e.ctrlKey && e.keyCode == 85) { 
                        disabledEvent(e);
                    }
                    // F12
                    if (e.keyCode == 123) { 
                        disabledEvent(e);
                    } 
                }, false);
                function disabledEvent(e) { 
                    if (e.stopPropagation) { 
                        e.stopPropagation();
                    } else if (window.event) { 
                        window.event.cancelBubble = true;
                    } 
                    e.preventDefault();
                    return false;
                }
            });
          `}
        </Script>
        <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-400/20 blur-[120px] rounded-full pointer-events-none -z-10" />
        <main className="flex-grow z-10 w-full max-w-7xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
