import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  
  if (!session.isLoggedIn || !session.accsoftCookies) {
    // Redirect to logout, passing the next param so they come back here
    return NextResponse.redirect(new URL("/api/auth/logout?type=accsoft&next=/accsoft/registration", req.url));
  }

  const cookieString = Object.entries(session.accsoftCookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

  try {
    const targetUrl = "https://accsoft.lnctu.ac.in/AccSoft2/Parents/StudentRegistrationFormPrint.aspx";
    let res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Cookie: cookieString,
        "User-Agent": "Mozilla/5.0",
        Referer: "https://accsoft.lnctu.ac.in/AccSoft2/Parents/StudentRegistrationForm.aspx",
      },
      cache: "no-store",
    });

    let html = await res.text();

    if (html.includes("Object moved") || res.redirected || html.includes("Session Expired") || html.includes('form id="form1" action="../Login.aspx"')) {
      return NextResponse.redirect(new URL("/api/auth/logout?type=accsoft&next=/accsoft/registration", req.url));
    }

    if (html.toLowerCase().includes("please open through registration form !!")) {
      // Trigger the intermediate navigation as required by the backend
      const intermediateUrl = "https://accsoft.lnctu.ac.in/AccSoft2/Parents/StudentRegistrationForm.aspx";
      await fetch(intermediateUrl, {
        method: "GET",
        headers: {
          Cookie: cookieString,
          "User-Agent": "Mozilla/5.0",
          Referer: "https://accsoft.lnctu.ac.in/AccSoft2/Parents/StudentDashboard.aspx",
        },
        cache: "no-store",
      });
      
      // Try fetching the print form again
      res = await fetch(targetUrl, {
        method: "GET",
        headers: {
          Cookie: cookieString,
          "User-Agent": "Mozilla/5.0",
          Referer: "https://accsoft.lnctu.ac.in/AccSoft2/Parents/StudentRegistrationForm.aspx",
        },
        cache: "no-store",
      });
      html = await res.text();
    }

    // Inject base tag so relative images/scripts load correctly from accsoft
    html = html.replace('<head id="Head1">', '<head id="Head1"><base href="https://accsoft.lnctu.ac.in/AccSoft2/Parents/" />');

    // Prevent the form from submitting and redirecting the browser to AccSoft when the print button is clicked
    html = html.replace('</body>', `<script>
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
                if (e.ctrlKey && e.shiftKey && e.keyCode == 73) { disabledEvent(e); }
                if (e.ctrlKey && e.shiftKey && e.keyCode == 74) { disabledEvent(e); } 
                if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) { disabledEvent(e); }
                if (e.ctrlKey && e.keyCode == 85) { disabledEvent(e); }
                if (e.keyCode == 123) { disabledEvent(e); } 
            }, false);
            function disabledEvent(e) { 
                if (e.stopPropagation) { e.stopPropagation(); } else if (window.event) { window.event.cancelBubble = true; } 
                e.preventDefault();
                return false;
            }
            var form = document.getElementById("form1"); if(form) form.onsubmit = function(e){ e.preventDefault(); return false; }; var btn = document.getElementById("btnPrint"); if(btn) { btn.type = "button"; btn.onclick = function(e) { e.preventDefault(); window.print(); return false; }; } 
        });
    </script></body>`);

    // Return the raw HTML straight to the browser
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
    
  } catch (e: any) {
    return new NextResponse(`Failed to load registration form: ${e.message}`, { status: 500 });
  }
}
