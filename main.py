import sys, os, threading, time, traceback
import os

# --- WebView nativo para Android ---
try:
    from jnius import autoclass, PythonJavaClass, java_method
    from android.runnable import run_on_ui_thread
    WEBVIEW_AVAILABLE = True
except ImportError:
    WEBVIEW_AVAILABLE = False

try:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
except:
    BASE_DIR = os.getcwd()

BACKEND_DIR = os.path.join(BASE_DIR, 'backend')
for p in [BASE_DIR, BACKEND_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)
os.chdir(BASE_DIR)

STATUS = ["Iniciando..."]

try:
    import kivy
    kivy.require("2.1.0")
    from kivy.app import App
    from kivy.uix.boxlayout import BoxLayout
    from kivy.uix.label import Label
    from kivy.uix.button import Button
    from kivy.clock import Clock
    KIVY_OK = True
except Exception as e:
    KIVY_OK = False

def iniciar_flask_en_hilo():
    try:
        STATUS.append(f"BASE:{BASE_DIR}")
        STATUS.append(f"backend:{os.path.exists(BACKEND_DIR)}")
        STATUS.append(f"archivos:{os.listdir(BASE_DIR)[:5]}")
        STATUS.append("importando flask...")
        import flask
        STATUS.append(f"flask OK {flask.__version__}")

        STATUS.append("importando tpv_rutas...")
        import tpv_rutas
        STATUS.append("tpv_rutas OK")

        STATUS.append("importando database...")
        import database
        STATUS.append("database OK")

        STATUS.append("importando app...")
        from app import app as flask_app
        STATUS.append("app OK")

        STATUS.append("creando tablas...")
        from database import crear_tablas
        crear_tablas()
        STATUS.append("DB OK - arrancando Flask")

        flask_app.run(host="0.0.0.0", port=8080, debug=False, use_reloader=False)
    except Exception as e:
        STATUS.append(f"ERROR:{e}")
        STATUS.append(traceback.format_exc()[-200:])

def esperar_flask(callback, max_intentos=20):
    import urllib.request
    for _ in range(max_intentos):
        try:
            urllib.request.urlopen("https://localhost:8080/api/status", timeout=1)
            callback(True)
            return
        except:
            time.sleep(0.5)
    callback(False)

if KIVY_OK:
    class TPVLayout(BoxLayout):
        def __init__(self, **kwargs):
            super().__init__(orientation="vertical", padding=15, spacing=10, **kwargs)
            self.add_widget(Label(text="TPV ULTRA SMART", font_size="18sp", bold=True, size_hint=(1,0.1)))
            self.info = Label(text="...", font_size="10sp", size_hint=(1,0.7), valign="top", halign="left")
            self.info.bind(size=self.info.setter('text_size'))
            self.add_widget(self.info)
            self.btn = Button(text="Abrir Navegador", size_hint=(1,0.1), disabled=True)
            self.btn.bind(on_press=lambda x: __import__('webbrowser').open("https://localhost:8080"))
            self.add_widget(self.btn)
            Clock.schedule_interval(self.update, 0.5)
            self.webview = None
            self.is_webview_attached = False

        def update(self, dt):
            self.info.text = "\n".join(STATUS[-15:])

        @run_on_ui_thread
        def attach_webview(self):
            if not WEBVIEW_AVAILABLE:
                return
            try:
                PythonActivity = autoclass('org.kivy.android.PythonActivity')
                activity = PythonActivity.mActivity

                WebView = autoclass('android.webkit.WebView')
                WebViewClient = autoclass('android.webkit.WebViewClient')
                LayoutParams = autoclass('android.view.ViewGroup$LayoutParams')
                WebSettings = autoclass('android.webkit.WebSettings')

                self.webview = WebView(activity)
                self.webview.setWebViewClient(WebViewClient())
                settings = self.webview.getSettings()
                settings.setJavaScriptEnabled(True)
                settings.setDomStorageEnabled(True)
                settings.setLoadWithOverviewMode(True)
                settings.setUseWideViewPort(True)

        if not os.environ.get('GITHUB_ACTIONS'):
                self.webview.loadUrl('https://localhost:8080')
        else:
            pass

                params = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
                activity.addContentView(self.webview, params)
                self.is_webview_attached = True

            except Exception as e:
                STATUS.append(f"WebView error: {e}")

        def set_ready(self, ok):
            def _do(dt):
                if ok:
                    STATUS.append("FLASK LISTO")
                    self.btn.disabled = False
                    if WEBVIEW_AVAILABLE:
                        self.attach_webview()
                else:
                    STATUS.append("FLASK NO RESPONDIO")
            Clock.schedule_once(_do, 0)

    class TPVApp(App):
        def build(self):
            self.layout = TPVLayout()
            threading.Thread(target=iniciar_flask_en_hilo, daemon=True).start()
            threading.Thread(target=esperar_flask, args=(self.layout.set_ready,), daemon=True).start()
            return self.layout

if KIVY_OK:
    TPVApp().run()
