/**
 * tpv-auth.js — TPV ULTRA SMART v5.0
 * Autenticación + Control de pestañas por rol
 *
 * JERARQUÍA DE ROLES Y ACCESO:
 * ────────────────────────────────────────────────────────
 * DESARROLLADOR → todo sin límites + licencias
 * ADMINISTRADOR → su tienda completa (NO licencias, NO configurar entorno)
 *   Catálogo: Vista Principal, Gestión Productos, Categorías,
 *             Inventario (Almacén + Vendedores), QR, Importar/Exportar
 *   Ventas:   Ventas Hoy, Nomenclador, Exportar Excel
 *   Registros: Historial, Copias de Seguridad
 *   Tienda, Configuración (Apariencia), Herramientas
 *   Usuarios: crea Supervisor y Vendedor
 *
 * SUPERVISOR → solo lectura/reportes
 *   Catálogo: Vista Principal
 *   Ventas:   Ventas Hoy, Nomenclador, Exportar Excel
 *   Registros: Historial
 *   Tienda, Configuración (Apariencia)
 *   Usuarios: solo ve lista + cambia su contraseña
 *
 * VENDEDOR → solo vender
 *   Catálogo: Vista Principal
 *   Orden Actual
 *   Ventas: Ventas Hoy (solo las suyas)
 *   Mi Inventario (su lista diaria con conteo final)
 *   Tienda
 *   Configuración (Apariencia)
 * ────────────────────────────────────────────────────────
 */

window.AUTH = { usuario: null, pollingNotif: null };

const ROL_INFO = {
    desarrollador: { color:'#7c3aed', icono:'bi-code-slash',    label:'Desarrollador' },
    administrador: { color:'#0d6efd', icono:'bi-shield-fill',   label:'Administrador' },
    supervisor:    { color:'#0891b2', icono:'bi-eye-fill',       label:'Supervisor'    },
    vendedor:      { color:'#059669', icono:'bi-bag-check-fill', label:'Vendedor'      },
    cliente:       { color:'#f59e0b', icono:'bi-person-heart',   label:'Cliente'       }
};

// Qué tabs ve cada rol. Todos los no listados se ocultan.
// 'todos' = todos los roles
const ACCESO_TABS = {
    // ── PRODUCTOS / GESTIÓN (solo admin+dev) ─────────────────────────────────
    'tpv-caja-tab':           ['desarrollador','administrador','supervisor','cliente'],
    'gestion-productos-tab':  ['desarrollador','administrador'],
    'gestion-categorias-tab': ['desarrollador','administrador'],
    // Inventario: admin+dev (Almacén+Vendedores+Gastos) | vendedor (su tabla diaria)
    'inv-inventario-tab':     ['desarrollador','administrador','vendedor'],
    'cliente-qr-tab':         ['desarrollador','administrador'],
    'importar-exportar-tab':  ['desarrollador','administrador'],
    // ── VENTAS ────────────────────────────────────────────────────────────────
    'orden-actual-tab':       ['desarrollador','administrador','supervisor','vendedor','cliente'],
    'ventas-hoy-tab':         ['desarrollador','administrador','supervisor','vendedor'],
    'nom-nomenclador-tab':    ['desarrollador','administrador','supervisor'],
    'exportar-ventas-tab':    ['desarrollador','administrador','supervisor'],
    // ── HISTORIAL ─────────────────────────────────────────────────────────────
    'registros-tab':          ['desarrollador','administrador','supervisor'],
    'copias-seguridad-tab':   ['desarrollador','administrador'],
    // ── TIENDA: todos los empleados la ven ────────────────────────────────────
    'tienda-tab':             ['desarrollador','administrador','supervisor','vendedor','cliente'],
    // ── CONFIG ────────────────────────────────────────────────────────────────
    'conf-config-tab':        ['desarrollador','administrador','supervisor','vendedor'],
    'licencias-tab':          ['desarrollador'],
    'herramientas-tab':       ['desarrollador','administrador'],
};

// ══════════════════════════════════════════════════════════════
//  CSS
// ══════════════════════════════════════════════════════════════
const _css = document.createElement('style');
_css.textContent = `
#login-screen {
    position:fixed;inset:0;z-index:9999;
    background:linear-gradient(135deg,#0d1b2a 0%,#1a3a5c 55%,#0d6efd 100%);
    display:flex;align-items:center;justify-content:center;
    padding:1rem;overflow-y:auto;
}
.login-card {
    background:white;border-radius:1.5rem;
    padding:2.5rem 2rem;width:100%;max-width:420px;
    box-shadow:0 25px 60px rgba(0,0,0,.45);
    animation:loginIn .35s ease;
}
@keyframes loginIn{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
.login-logo{
    width:72px;height:72px;border-radius:50%;
    background:linear-gradient(135deg,#0d6efd,#0a58ca);
    color:white;font-size:2rem;
    display:flex;align-items:center;justify-content:center;
    margin:0 auto 1rem;box-shadow:0 8px 20px rgba(13,110,253,.35);
}
.login-title{text-align:center;font-weight:800;color:#1e293b;margin:0;font-size:1.6rem}
.login-sub{text-align:center;color:#64748b;font-size:.88rem;margin-bottom:1.5rem}
.login-error{
    background:#fee2e2;border:1px solid #fca5a5;color:#dc2626;
    border-radius:.75rem;padding:.8rem 1rem;margin-bottom:1rem;font-size:.88rem;
    display:flex;align-items:flex-start;gap:.5rem;
}
.login-error i{flex-shrink:0;margin-top:2px}
.login-hint{
    background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;
    border-radius:.75rem;padding:.8rem 1rem;margin-bottom:1rem;font-size:.83rem;
}
.login-hint code{background:#dbeafe;padding:.1rem .3rem;border-radius:.3rem;font-size:.82rem}
.login-field{margin-bottom:1rem}
.login-field label{display:block;font-weight:600;color:#374151;margin-bottom:.4rem;font-size:.88rem}
.pw-wrap{position:relative}
.login-input{
    width:100%;padding:.75rem 1rem;border-radius:.75rem;
    border:2px solid #e2e8f0;font-size:1rem;outline:none;
    transition:border-color .2s;box-sizing:border-box;background:white;
}
.login-input:focus{border-color:#0d6efd;box-shadow:0 0 0 3px rgba(13,110,253,.12)}
.pw-eye{
    position:absolute;right:.75rem;top:50%;transform:translateY(-50%);
    background:none;border:none;cursor:pointer;color:#94a3b8;
    padding:.3rem;font-size:1rem;line-height:1;transition:color .15s;
}
.pw-eye:hover{color:#0d6efd}
.login-btn{
    width:100%;padding:.85rem;border:none;border-radius:.75rem;
    background:linear-gradient(135deg,#0d6efd,#0a58ca);color:white;
    font-size:1rem;font-weight:700;cursor:pointer;margin-top:.25rem;
    transition:transform .15s,box-shadow .15s;
    box-shadow:0 4px 14px rgba(13,110,253,.35);
}
.login-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(13,110,253,.45)}
.login-btn:disabled{opacity:.65;cursor:not-allowed}
.login-footer{text-align:center;color:#94a3b8;font-size:.78rem;margin-top:1.25rem}
.login-divider{display:flex;align-items:center;gap:.75rem;margin:1rem 0;color:#94a3b8;font-size:.82rem}
.login-divider::before,.login-divider::after{content:'';flex:1;height:1px;background:#e2e8f0}
.login-btn-cliente{width:100%;padding:.72rem;border-radius:.8rem;font-size:1rem;font-weight:700;cursor:pointer;transition:all .2s;border:2px solid #f59e0b;background:linear-gradient(135deg,#fef3c7,#fde68a);color:#92400e}
.login-btn-cliente:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(245,158,11,.35)}
/* Barra usuario */
#user-bar{
    background:linear-gradient(90deg,#1e293b,#0f172a);
    color:white;padding:.45rem 1rem;
    position:sticky;top:0;z-index:1000;
}
.ub-inner{display:flex;justify-content:space-between;align-items:center;max-width:1200px;margin:auto;gap:.5rem}
.ub-info{display:flex;align-items:center;gap:.4rem;font-size:.88rem;min-width:0;flex:1}
.ub-badge{padding:.18rem .55rem;border-radius:999px;font-size:.7rem;font-weight:700;text-transform:uppercase;flex-shrink:0}
.ub-actions{display:flex;gap:.4rem;flex-shrink:0}
.ub-btn{
    background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);
    color:white;padding:.3rem .65rem;border-radius:.5rem;
    font-size:.78rem;cursor:pointer;transition:background .15s;white-space:nowrap;
}
.ub-btn:hover{background:rgba(255,255,255,.22)}
.ub-btn.out:hover{background:rgba(220,53,69,.55);border-color:#dc3545}
/* Campana */
#notif-bell-wrap{display:flex;align-items:center}
.bell-btn{
    width:36px;height:36px;padding:0;
    display:flex;align-items:center;justify-content:center;
    border-radius:50%!important;font-size:1rem;
}
.bell-btn.ring{
    animation:bRing .5s ease infinite alternate;
    background:#ffc107!important;color:#1e293b!important;border-color:#ffc107!important;
}
@keyframes bRing{from{transform:rotate(-14deg)}to{transform:rotate(14deg)}}
/* Toast pedido */
.toast-ped{
    position:fixed;bottom:1rem;right:1rem;z-index:10000;
    background:white;border-radius:1rem;padding:.9rem 1.1rem;
    box-shadow:0 8px 28px rgba(0,0,0,.18);border-left:4px solid #f59e0b;
    display:flex;align-items:center;gap:.65rem;max-width:280px;
    animation:slideR .28s ease;
}
@keyframes slideR{from{opacity:0;transform:translateX(90px)}to{opacity:1;transform:translateX(0)}}
/* Modal usuarios */
.u-card{
    display:flex;align-items:center;justify-content:space-between;
    padding:.7rem .9rem;border-radius:.7rem;margin-bottom:.45rem;
    background:#f8fafc;border:1px solid #e2e8f0;gap:.5rem;
}
.u-pill{padding:.18rem .55rem;border-radius:999px;font-size:.7rem;font-weight:700;text-transform:uppercase}
`;
document.head.appendChild(_css);

// ══════════════════════════════════════════════════════════════
//  HTML INYECTADO
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

    // Pantalla login
    const ls = document.createElement('div');
    ls.id = 'login-screen';
    ls.innerHTML = `
    <div class="login-card" style="max-width:440px">
        <div class="login-logo"><i class="bi bi-shop-window"></i></div>
        <h2 class="login-title">TPV Ultra Smart</h2>

        <!-- Selector Staff / Cliente -->
        <div style="display:flex;background:#f1f5f9;border-radius:.75rem;padding:4px;margin-bottom:1.2rem">
            <button id="modo-staff-btn" onclick="auth_setModo('staff')"
                style="flex:1;padding:.5rem;border:none;border-radius:.6rem;font-weight:600;font-size:.88rem;cursor:pointer;transition:all .2s;background:#0d6efd;color:white;box-shadow:0 2px 6px rgba(13,110,253,.35)">
                <i class="bi bi-person-badge me-1"></i>Personal
            </button>
            <button id="modo-cliente-btn" onclick="auth_setModo('cliente')"
                style="flex:1;padding:.5rem;border:none;border-radius:.6rem;font-weight:600;font-size:.88rem;cursor:pointer;transition:all .2s;background:transparent;color:#64748b">
                <i class="bi bi-bag-heart me-1"></i>Cliente
            </button>
        </div>

        <!-- Error / Hint compartidos -->
        <div id="login-error" class="login-error" style="display:none">
            <i class="bi bi-exclamation-triangle-fill"></i>
            <div id="login-error-msg"></div>
        </div>
        <div id="login-hint" class="login-hint" style="display:none">
            <strong>Flask no responde.</strong> Abre Pydroid3 y ejecuta:<br>
            <code>python app.py</code> — luego recarga esta página.
        </div>

        <!-- PANEL STAFF -->
        <div id="panel-staff">
            <p class="login-sub" style="margin-bottom:1rem">Acceso para empleados</p>
            <div class="login-field">
                <label><i class="bi bi-person me-1"></i>Usuario</label>
                <input id="login-username" class="login-input" type="text"
                       placeholder="ej: desarrollador" autocomplete="username"
                       onkeydown="if(event.key==='Enter')document.getElementById('login-password').focus()">
            </div>
            <div class="login-field">
                <label><i class="bi bi-lock me-1"></i>Contraseña</label>
                <div class="pw-wrap">
                    <input id="login-password" class="login-input" type="password"
                           placeholder="••••••••" autocomplete="current-password"
                           style="padding-right:3rem"
                           onkeydown="if(event.key==='Enter')auth_login()">
                    <button type="button" class="pw-eye" onclick="auth_togglePw(this)" tabindex="-1">
                        <i class="bi bi-eye-slash"></i>
                    </button>
                </div>
            </div>
            <button id="login-btn" class="login-btn" onclick="auth_login()">
                <span id="lbtn-txt"><i class="bi bi-box-arrow-in-right me-2"></i>Entrar</span>
                <span id="lbtn-spin" style="display:none">
                    <span class="spinner-border spinner-border-sm me-2"></span>Verificando...
                </span>
            </button>
            <div class="login-footer">
                <i class="bi bi-shield-lock me-1"></i>Acceso restringido al personal autorizado
            </div>
        </div>

        <!-- PANEL CLIENTE -->
        <div id="panel-cliente" style="display:none">
            <!-- Sub-tabs: Iniciar sesión / Registrarse -->
            <div style="display:flex;border-bottom:2px solid #e2e8f0;margin-bottom:1rem">
                <button id="cli-tab-login" onclick="auth_cliTab('login')"
                    style="flex:1;padding:.55rem;border:none;background:none;font-weight:700;font-size:.88rem;cursor:pointer;color:#0d6efd;border-bottom:2px solid #0d6efd;margin-bottom:-2px">
                    <i class="bi bi-box-arrow-in-right me-1"></i>Iniciar sesión
                </button>
                <button id="cli-tab-reg" onclick="auth_cliTab('registro')"
                    style="flex:1;padding:.55rem;border:none;background:none;font-weight:600;font-size:.88rem;cursor:pointer;color:#94a3b8;border-bottom:2px solid transparent;margin-bottom:-2px">
                    <i class="bi bi-person-plus me-1"></i>Registrarse
                </button>
            </div>

            <!-- Login cliente -->
            <div id="cli-panel-login">
                <div class="login-field">
                    <label><i class="bi bi-envelope me-1"></i>Email</label>
                    <input id="cli-email" class="login-input" type="email"
                           placeholder="tu@email.com" autocomplete="email"
                           onkeydown="if(event.key==='Enter')document.getElementById('cli-pw').focus()">
                </div>
                <div class="login-field">
                    <label><i class="bi bi-lock me-1"></i>Contraseña</label>
                    <div class="pw-wrap">
                        <input id="cli-pw" class="login-input" type="password"
                               placeholder="••••••••" style="padding-right:3rem"
                               onkeydown="if(event.key==='Enter')auth_loginCliente()">
                        <button type="button" class="pw-eye" onclick="auth_togglePw(this)" tabindex="-1">
                            <i class="bi bi-eye-slash"></i>
                        </button>
                    </div>
                </div>
                <button class="login-btn" onclick="auth_loginCliente()">
                    <span id="cli-lbtn-txt"><i class="bi bi-bag-heart me-2"></i>Entrar a la tienda</span>
                    <span id="cli-lbtn-spin" style="display:none">
                        <span class="spinner-border spinner-border-sm me-2"></span>Verificando...
                    </span>
                </button>
                <div class="login-footer" style="margin-top:.8rem">
                    ¿Sin cuenta? <a href="#" onclick="auth_cliTab('registro');return false" style="color:#0d6efd;font-weight:600">Regístrate gratis</a>
                </div>
            </div>

            <!-- Registro cliente -->
            <div id="cli-panel-reg" style="display:none">
                <div class="login-field">
                    <label><i class="bi bi-person me-1"></i>Nombre completo</label>
                    <input id="reg-nombre" class="login-input" type="text" placeholder="Tu nombre">
                </div>
                <div class="login-field">
                    <label><i class="bi bi-envelope me-1"></i>Email</label>
                    <input id="reg-email" class="login-input" type="email" placeholder="tu@email.com">
                </div>
                <div class="login-field">
                    <label><i class="bi bi-phone me-1"></i>Teléfono <small style="color:#94a3b8">(opcional)</small></label>
                    <input id="reg-telefono" class="login-input" type="tel" placeholder="+1 555 000 0000">
                </div>
                <div class="login-field">
                    <label><i class="bi bi-lock me-1"></i>Contraseña</label>
                    <div class="pw-wrap">
                        <input id="reg-pw" class="login-input" type="password"
                               placeholder="Mínimo 4 caracteres" style="padding-right:3rem"
                               onkeydown="if(event.key==='Enter')auth_registrarCliente()">
                        <button type="button" class="pw-eye" onclick="auth_togglePw(this)" tabindex="-1">
                            <i class="bi bi-eye-slash"></i>
                        </button>
                    </div>
                </div>
                <button class="login-btn" onclick="auth_registrarCliente()"
                    style="background:linear-gradient(135deg,#059669,#047857)">
                    <span id="reg-btn-txt"><i class="bi bi-person-check me-2"></i>Crear cuenta</span>
                    <span id="reg-btn-spin" style="display:none">
                        <span class="spinner-border spinner-border-sm me-2"></span>Creando cuenta...
                    </span>
                </button>
                <div class="login-footer" style="margin-top:.8rem">
                    ¿Ya tienes cuenta? <a href="#" onclick="auth_cliTab('login');return false" style="color:#0d6efd;font-weight:600">Inicia sesión</a>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertBefore(ls, document.body.firstChild);

    // Barra de usuario
    const ub = document.createElement('div');
    ub.id = 'user-bar';
    ub.className = 'd-none';
    ub.innerHTML = `
    <div class="ub-inner">
        <div class="ub-info">
            <i id="ub-icon" class="bi bi-person-circle"></i>
            <span id="ub-name" class="fw-semibold text-truncate">—</span>
            <span id="ub-badge" class="ub-badge">—</span>
        </div>
        <div class="ub-actions">
            <button id="btn-licencias" class="ub-btn d-none" onclick="lic_abrir()"
                    style="background:rgba(124,58,237,.25);border-color:rgba(124,58,237,.5)">
                <i class="bi bi-key-fill me-1"></i><span class="d-none d-sm-inline">Licencias</span>
            </button>
            <button id="btn-usuarios" class="ub-btn d-none" onclick="auth_abrirUsuarios()">
                <i class="bi bi-people-fill me-1"></i><span class="d-none d-sm-inline">Usuarios</span>
            </button>
            <button class="ub-btn out" onclick="auth_logout()">
                <i class="bi bi-box-arrow-right me-1"></i><span class="d-none d-sm-inline">Salir</span>
            </button>
        </div>
    </div>`;
    document.body.insertBefore(ub, document.body.firstChild);

    // Campana de notificaciones
    const ns = document.getElementById('network-status');
    if (ns) {
        const bw = document.createElement('div');
        bw.id = 'notif-bell-wrap';
        bw.className = 'me-2 d-none';
        bw.innerHTML = `
        <button class="btn btn-sm btn-outline-warning bell-btn position-relative"
                onclick="auth_verNotificaciones()" title="Pedidos pendientes">
            <i class="bi bi-bell-fill"></i>
            <span id="bell-badge"
                  class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger d-none"
                  style="font-size:.58rem">0</span>
        </button>`;
        ns.parentNode.insertBefore(bw, ns);
    }

    // Modales
    document.body.insertAdjacentHTML('beforeend', `

    <!-- Modal Gestión Usuarios -->
    <div class="modal fade" id="modal-usuarios" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header text-white fw-bold"
               style="background:linear-gradient(135deg,#0d6efd,#0a58ca)">
            <span><i class="bi bi-people-fill me-2"></i>Gestión de Usuarios</span>
            <button class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-0">
            <ul class="nav nav-tabs px-3 pt-2">
              <li class="nav-item"><button class="nav-link active" id="ut-lista" onclick="auth_tab('lista')"><i class="bi bi-list-ul me-1"></i>Lista</button></li>
              <li class="nav-item" id="ut-crear-li"><button class="nav-link" id="ut-crear" onclick="auth_tab('crear')"><i class="bi bi-person-plus-fill me-1"></i>Crear</button></li>
              <li class="nav-item"><button class="nav-link" id="ut-pw" onclick="auth_tab('pw')"><i class="bi bi-key-fill me-1"></i>Mi Contraseña</button></li>
            </ul>
            <div id="up-lista" class="p-3">
              <div id="u-lista-body" class="text-center py-4 text-muted">
                <div class="spinner-border spinner-border-sm me-2"></div>Cargando...
              </div>
            </div>
            <div id="up-crear" class="p-3 d-none">
              <div class="row g-3">
                <div class="col-12 col-sm-6">
                  <label class="form-label fw-semibold">Nombre completo</label>
                  <input id="nu-nombre" class="form-control" placeholder="Ej: Juan Pérez">
                </div>
                <div class="col-12 col-sm-6">
                  <label class="form-label fw-semibold">Usuario (login)</label>
                  <input id="nu-user" class="form-control" placeholder="ej: juan.perez" autocomplete="off">
                </div>
                <div class="col-12 col-sm-6">
                  <label class="form-label fw-semibold">Contraseña</label>
                  <div class="pw-wrap">
                    <input id="nu-pw" class="form-control" type="password" placeholder="Mínimo 4 caracteres"
                           style="padding-right:2.5rem" autocomplete="new-password">
                    <button type="button" class="pw-eye" onclick="auth_togglePw(this)" tabindex="-1">
                      <i class="bi bi-eye-slash"></i>
                    </button>
                  </div>
                </div>
                <div class="col-12 col-sm-6">
                  <label class="form-label fw-semibold">Rol</label>
                  <select id="nu-rol" class="form-select">
                    <option value="">— Seleccionar —</option>
                  </select>
                </div>
                <div class="col-12">
                  <button class="btn btn-primary w-100 fw-bold" onclick="auth_crearUsuario()">
                    <i class="bi bi-person-plus-fill me-2"></i>Crear Usuario
                  </button>
                </div>
              </div>
            </div>
            <div id="up-pw" class="p-3 d-none">
              <div class="row g-3" style="max-width:360px;margin:auto">
                <div class="col-12">
                  <label class="form-label fw-semibold">Contraseña actual</label>
                  <div class="pw-wrap">
                    <input id="pw-act" class="form-control" type="password" style="padding-right:2.5rem">
                    <button type="button" class="pw-eye" onclick="auth_togglePw(this)" tabindex="-1"><i class="bi bi-eye-slash"></i></button>
                  </div>
                </div>
                <div class="col-12">
                  <label class="form-label fw-semibold">Nueva contraseña</label>
                  <div class="pw-wrap">
                    <input id="pw-new" class="form-control" type="password" style="padding-right:2.5rem">
                    <button type="button" class="pw-eye" onclick="auth_togglePw(this)" tabindex="-1"><i class="bi bi-eye-slash"></i></button>
                  </div>
                </div>
                <div class="col-12">
                  <label class="form-label fw-semibold">Confirmar nueva contraseña</label>
                  <div class="pw-wrap">
                    <input id="pw-con" class="form-control" type="password" style="padding-right:2.5rem">
                    <button type="button" class="pw-eye" onclick="auth_togglePw(this)" tabindex="-1"><i class="bi bi-eye-slash"></i></button>
                  </div>
                </div>
                <div class="col-12">
                  <button class="btn btn-warning w-100 fw-bold" onclick="auth_cambiarPw()">
                    <i class="bi bi-key-fill me-2"></i>Cambiar Contraseña
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Licencias (solo Desarrollador) -->
    <div class="modal fade" id="modal-licencias" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header text-white fw-bold"
               style="background:linear-gradient(135deg,#7c3aed,#5b21b6)">
            <span><i class="bi bi-key-fill me-2"></i>Gestión de Licencias</span>
            <button class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-0">
            <ul class="nav nav-tabs px-3 pt-2">
              <li class="nav-item"><button class="nav-link active" id="lt-lista" onclick="lic_tab('lista')"><i class="bi bi-list-ul me-1"></i>Licencias</button></li>
              <li class="nav-item"><button class="nav-link" id="lt-crear" onclick="lic_tab('crear')"><i class="bi bi-plus-circle-fill me-1"></i>Asignar</button></li>
            </ul>
            <div id="lp-lista" class="p-3">
              <div id="lic-lista-body" class="text-center text-muted py-3">
                <div class="spinner-border spinner-border-sm"></div>
              </div>
            </div>
            <div id="lp-crear" class="p-3 d-none">
              <div class="row g-3" style="max-width:500px;margin:auto">
                <div class="col-12">
                  <label class="form-label fw-bold">
                    <i class="bi bi-person-badge-fill me-1 text-primary"></i>Administrador
                  </label>
                  <input type="text" id="lic-admin-id" class="form-control"
                         placeholder="Selecciona de la lista o pega el ID...">
                  <div id="lic-admin-lista" class="list-group mt-1" style="max-height:130px;overflow-y:auto"></div>
                </div>
                <div class="col-12">
                  <label class="form-label fw-bold">
                    <i class="bi bi-phone-fill me-1 text-info"></i>
                    ID Cliente del dispositivo del Admin
                    <span class="badge bg-info ms-1" style="font-size:.65rem">REQUERIDO</span>
                  </label>
                  <input type="text" id="lic-cliente-id" class="form-control font-monospace"
                         placeholder="El admin lo ve en: Configuración → Licencias → ID de este dispositivo">
                  <small class="text-muted">
                    <i class="bi bi-info-circle me-1"></i>
                    El admin abre su TPV → <strong>Configuración → Licencias</strong> y copia su <strong>ID</strong>.
                  </small>
                </div>
                <div class="col-6">
                  <label class="form-label fw-bold">Tipo</label>
                  <select id="lic-tipo" class="form-select" onchange="lic_actualizarDias()">
                    <option value="diaria">Diaria (1 día)</option>
                    <option value="mensual">Mensual (30 días)</option>
                    <option value="anual" selected>Anual (365 días)</option>
                    <option value="personalizada">Personalizada</option>
                    <option value="ilimitada">Ilimitada (∞)</option>
                  </select>
                </div>
                <div class="col-6">
                  <label class="form-label fw-bold">Días</label>
                  <input type="number" id="lic-dias" class="form-control" value="365" min="1">
                </div>
                <div class="col-12">
                  <label class="form-label fw-bold">Notas (opcional)</label>
                  <input type="text" id="lic-notas" class="form-control"
                         placeholder="Ej: Pago recibido — Mensual marzo">
                </div>
                <div class="col-12">
                  <button class="btn w-100 fw-bold text-white" onclick="lic_crear()"
                          style="background:#7c3aed">
                    <i class="bi bi-key-fill me-2"></i>Generar Clave de Licencia
                  </button>
                </div>
                <!-- Resultado: clave generada -->
                <div class="col-12" id="lic-resultado-wrap" style="display:none">
                  <div class="alert alert-success"
                       style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:2px solid #22c55e">
                    <div class="fw-bold text-success mb-2">
                      <i class="bi bi-check-circle-fill me-2"></i>¡Clave generada! Envíasela al administrador.
                    </div>
                    <div class="input-group">
                      <input type="text" id="lic-clave-generada" class="form-control font-monospace"
                             readonly style="font-size:.7rem;background:#fff">
                      <button class="btn btn-success" onclick="lic_copiarClave()" title="Copiar clave">
                        <i class="bi bi-clipboard-fill"></i>
                      </button>
                    </div>
                    <div class="text-muted mt-2" style="font-size:.75rem">
                      <i class="bi bi-arrow-right-circle me-1"></i>
                      El admin pega esta clave en <strong>Configuración → Licencias → Activar</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Notificaciones Pedidos -->
    <div class="modal fade" id="modal-notif" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-warning">
            <h5 class="modal-title fw-bold text-dark">
              <i class="bi bi-bell-fill me-2"></i>Pedidos Pendientes
            </h5>
            <button class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" id="notif-body">
            <div class="text-center py-3 text-muted">Cargando...</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" data-bs-dismiss="modal"
                    onclick="document.getElementById('tienda-tab')?.click()">
              <i class="bi bi-shop me-1"></i>Ir a Tienda
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Inventario Vendedores (Admin) -->
    <div class="modal fade" id="modal-inv-vendedores" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content">
          <div class="modal-header" style="background:linear-gradient(135deg,#059669,#047857);color:white">
            <h5 class="modal-title fw-bold">
              <i class="bi bi-people-fill me-2"></i>Inventario Diario de Vendedores
            </h5>
            <button class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" id="inv-vendedores-body">
            <div class="text-center py-4 text-muted">
              <div class="spinner-border me-2"></div>Cargando...
            </div>
          </div>
        </div>
      </div>
    </div>`);

    // ── Si el usuario ya hizo login con el formulario estático,
    //    _pendingLogin tiene sus datos. Mostrar la app directamente.
    if (window._pendingLogin) {
        AUTH.usuario = window._pendingLogin;
        window._pendingLogin = null;
        // Ocultar AMBAS pantallas de login
        var _sx = document.getElementById('login-screen-static');
        if (_sx) _sx.style.display = 'none';
        var _lsd = document.getElementById('login-screen');
        if (_lsd) _lsd.classList.add('d-none');
        // Mostrar la app
        _auth_mostrarApp();
    } else {
        // Flujo normal: verificar sesión existente o mostrar login
        _auth_init();
    }
});

// ══════════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════════
async function _auth_init(intentos = 0) {
    if (typeof bootstrap === 'undefined') {
        if (intentos < 30) setTimeout(() => _auth_init(intentos + 1), 150);
        return;
    }
    try {
        const ctrl = new AbortController();
        setTimeout(() => ctrl.abort(), 4000);
        const res  = await fetch('/api/auth/me', { signal: ctrl.signal, credentials: 'same-origin' });
        const data = await res.json();
        if (res.ok && data.autenticado && data.usuario) {
            AUTH.usuario = data.usuario;
            _auth_mostrarApp();
            return;
        }
    } catch(e) {}
    auth_setModo('cliente');
}

// ══════════════════════════════════════════════════════════════
//  MODO LOGIN: STAFF / CLIENTE
// ══════════════════════════════════════════════════════════════
function auth_setModo(modo) {
    const panelStaff    = document.getElementById('panel-staff');
    const panelCliente  = document.getElementById('panel-cliente');
    const btnStaff      = document.getElementById('modo-staff-btn');
    const btnCliente    = document.getElementById('modo-cliente-btn');
    const activeStyle   = 'background:#0d6efd;color:white;box-shadow:0 2px 6px rgba(13,110,253,.35)';
    const inactiveStyle = 'background:transparent;color:#64748b;box-shadow:none';

    document.getElementById('login-error').style.display = 'none';

    if (modo === 'staff') {
        panelStaff.style.display   = '';
        panelCliente.style.display = 'none';
        btnStaff.style.cssText    += ';' + activeStyle;
        btnCliente.style.cssText  += ';' + inactiveStyle;
        btnStaff.style.background  = '#0d6efd';
        btnStaff.style.color       = 'white';
        btnCliente.style.background= 'transparent';
        btnCliente.style.color     = '#64748b';
        btnCliente.style.boxShadow = 'none';
        setTimeout(() => document.getElementById('login-username')?.focus(), 50);
    } else {
        panelStaff.style.display   = 'none';
        panelCliente.style.display = '';
        btnCliente.style.background= '#0d6efd';
        btnCliente.style.color     = 'white';
        btnCliente.style.boxShadow = '0 2px 6px rgba(13,110,253,.35)';
        btnStaff.style.background  = 'transparent';
        btnStaff.style.color       = '#64748b';
        btnStaff.style.boxShadow   = 'none';
        setTimeout(() => document.getElementById('cli-email')?.focus(), 50);
    }
}

// Sub-tabs del panel cliente
function auth_cliTab(tab) {
    const panelLogin = document.getElementById('cli-panel-login');
    const panelReg   = document.getElementById('cli-panel-reg');
    const btnLogin   = document.getElementById('cli-tab-login');
    const btnReg     = document.getElementById('cli-tab-reg');
    document.getElementById('login-error').style.display = 'none';

    if (tab === 'login') {
        panelLogin.style.display = '';
        panelReg.style.display   = 'none';
        btnLogin.style.color        = '#0d6efd';
        btnLogin.style.borderBottom = '2px solid #0d6efd';
        btnLogin.style.fontWeight   = '700';
        btnReg.style.color          = '#94a3b8';
        btnReg.style.borderBottom   = '2px solid transparent';
        btnReg.style.fontWeight     = '600';
        setTimeout(() => document.getElementById('cli-email')?.focus(), 50);
    } else {
        panelLogin.style.display = 'none';
        panelReg.style.display   = '';
        btnReg.style.color          = '#0d6efd';
        btnReg.style.borderBottom   = '2px solid #0d6efd';
        btnReg.style.fontWeight     = '700';
        btnLogin.style.color        = '#94a3b8';
        btnLogin.style.borderBottom = '2px solid transparent';
        btnLogin.style.fontWeight   = '600';
        setTimeout(() => document.getElementById('reg-nombre')?.focus(), 50);
    }
}

// Login de cliente (con email + contraseña)
async function auth_loginCliente() {
    const email = document.getElementById('cli-email')?.value.trim();
    const pw    = document.getElementById('cli-pw')?.value;
    document.getElementById('login-error').style.display = 'none';

    if (!email || !pw) { _loginErr('Introduce tu email y contraseña.'); return; }

    const btnTxt  = document.getElementById('cli-lbtn-txt');
    const btnSpin = document.getElementById('cli-lbtn-spin');
    if (btnTxt)  btnTxt.style.display  = 'none';
    if (btnSpin) btnSpin.style.display = '';

    try {
        const res  = await fetch('/api/clientes/login', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ email, password: pw }),
            credentials: 'same-origin'
        });
        const data = await res.json();
        if (res.ok && data.ok) {
            AUTH.usuario = {
                usuario_id: data.cliente.id,
                username:   data.cliente.email,
                nombre:     data.cliente.nombre,
                rol:        'cliente',
                imagen:     data.cliente.imagen || ''
            };
            _auth_mostrarAppCliente();
        } else {
            _loginErr(data.error || 'Email o contraseña incorrectos.');
            document.getElementById('cli-pw').value = '';
        }
    } catch(e) {
        _loginErr('Sin conexión con el servidor.');
        document.getElementById('login-hint').style.display = '';
    } finally {
        if (btnTxt)  btnTxt.style.display  = '';
        if (btnSpin) btnSpin.style.display = 'none';
    }
}

// Registro de cliente nuevo
async function auth_registrarCliente() {
    const nombre   = document.getElementById('reg-nombre')?.value.trim();
    const email    = document.getElementById('reg-email')?.value.trim();
    const telefono = document.getElementById('reg-telefono')?.value.trim();
    const pw       = document.getElementById('reg-pw')?.value;
    document.getElementById('login-error').style.display = 'none';

    if (!nombre || !email || !pw) { _loginErr('Nombre, email y contraseña son obligatorios.'); return; }
    if (pw.length < 4)            { _loginErr('La contraseña debe tener mínimo 4 caracteres.'); return; }
    if (!email.includes('@'))     { _loginErr('Email inválido.'); return; }

    const btnTxt  = document.getElementById('reg-btn-txt');
    const btnSpin = document.getElementById('reg-btn-spin');
    if (btnTxt)  btnTxt.style.display  = 'none';
    if (btnSpin) btnSpin.style.display = '';

    try {
        const res  = await fetch('/api/clientes/registrar', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ nombre, email, password: pw, telefono }),
            credentials: 'same-origin'
        });
        const data = await res.json();
        if (res.ok && data.ok) {
            // Registro OK → hacer login automático
            document.getElementById('cli-email').value = email;
            document.getElementById('cli-pw').value    = pw;
            await auth_loginCliente();
        } else {
            _loginErr(data.error || 'No se pudo crear la cuenta.');
        }
    } catch(e) {
        _loginErr('Sin conexión con el servidor.');
    } finally {
        if (btnTxt)  btnTxt.style.display  = '';
        if (btnSpin) btnSpin.style.display = 'none';
    }
}

// Mostrar app para el cliente (solo tienda, catálogo y orden)
function _auth_mostrarAppCliente() {
    const ls = document.getElementById('login-screen');
    if (ls) { ls.style.opacity = '0'; setTimeout(() => ls.classList.add('d-none'), 290); }

    const u  = AUTH.usuario;
    const ub = document.getElementById('user-bar');
    if (ub) ub.classList.remove('d-none');

    const icon  = document.getElementById('ub-icon');
    const name  = document.getElementById('ub-name');
    const badge = document.getElementById('ub-badge');
    if (icon)  { icon.className = 'bi bi-person-circle'; icon.style.color = '#059669'; }
    if (name)  name.textContent = u.nombre;
    if (badge) { badge.textContent = 'Cliente'; badge.style.cssText = 'background:#d1fae5;color:#059669;border:1px solid #6ee7b7'; }

    // Ocultar botones de staff
    document.getElementById('btn-usuarios')?.classList.add('d-none');
    document.getElementById('btn-licencias')?.classList.add('d-none');
    document.getElementById('notif-bell-wrap')?.classList.add('d-none');

    const appDiv = document.getElementById('tpv-app');
    if (appDiv) appDiv.style.display = '';

    function _lanzarCliente() {
        if (typeof bootstrap === 'undefined') { setTimeout(_lanzarCliente, 100); return; }
        if (typeof loadState === 'function') {
            loadState().then(() => {
                if (typeof initializeUI === 'function') initializeUI();
                setTimeout(_auth_aplicarTabsCliente, 300);
            });
        } else {
            if (typeof initializeUI === 'function') initializeUI();
            setTimeout(_auth_aplicarTabsCliente, 300);
        }
    }
    _lanzarCliente();
}

// Aplicar permisos de tabs para el rol cliente
function _auth_aplicarTabsCliente() {
    const tabsPermitidos = ['gestion-productos-tab', 'tienda-tab', 'orden-actual-tab'];

    // Ocultar todos los tabs primero
    Object.keys(ACCESO_TABS).forEach(tabId => {
        const tab = document.getElementById(tabId);
        if (!tab) return;
        const li = tab.closest('li');
        const permitido = tabsPermitidos.includes(tabId);
        if (li) li.style.display = permitido ? '' : 'none';
        else    tab.style.display = permitido ? '' : 'none';
    });

    // Ocultar menús dropdown vacíos
    document.querySelectorAll('#main-nav-tabs .nav-item.dropdown').forEach(dd => {
        const items = dd.querySelectorAll('li');
        const hayVisible = [...items].some(li =>
            li.style.display !== 'none' && !li.querySelector('hr') && li.querySelector('a,button')
        );
        dd.style.display = hayVisible ? '' : 'none';
    });

    // Ir directo a la tienda
    setTimeout(() => document.getElementById('tienda-tab')?.click(), 350);
    console.log('[Auth] Tabs cliente aplicados');
}

// ══════════════════════════════════════════════════════════════
//  TOGGLE CONTRASEÑA (ojito)
// ══════════════════════════════════════════════════════════════
function auth_togglePw(btn) {
    const input = btn.closest('.pw-wrap')?.querySelector('input') ||
                  document.getElementById('login-password');
    const icon  = btn.querySelector('i');
    if (!input || !icon) return;
    const mostrar  = input.type === 'password';
    input.type     = mostrar ? 'text' : 'password';
    icon.className = mostrar ? 'bi bi-eye' : 'bi bi-eye-slash';
}

// ══════════════════════════════════════════════════════════════
//  LOGIN
// ══════════════════════════════════════════════════════════════
async function auth_login() {
    const usr = document.getElementById('login-username')?.value.trim();
    const pw  = document.getElementById('login-password')?.value;
    document.getElementById('login-error').style.display  = 'none';
    document.getElementById('login-hint').style.display   = 'none';

    if (!usr || !pw) { _loginErr('Introduce usuario y contraseña.'); return; }

    document.getElementById('login-btn').disabled = true;
    document.getElementById('lbtn-txt').style.display  = 'none';
    document.getElementById('lbtn-spin').style.display = '';

    try {
        const ctrl = new AbortController();
        setTimeout(() => ctrl.abort(), 10000);
        const res  = await fetch('/api/auth/login', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ username:usr, password:pw }),
            signal: ctrl.signal, credentials:'same-origin'
        });
        const data = await res.json();
        if (res.ok && data.ok) {
            AUTH.usuario = data.usuario;
            _auth_mostrarApp();
        } else {
            _loginErr(data.error || 'Usuario o contraseña incorrectos.');
            document.getElementById('login-password').value = '';
            document.getElementById('login-password').focus();
        }
    } catch(e) {
        _loginErr(e.name === 'AbortError' ? 'El servidor tardó demasiado.' : 'Sin conexión con el servidor.');
        document.getElementById('login-hint').style.display = '';
    } finally {
        document.getElementById('login-btn').disabled = false;
        document.getElementById('lbtn-txt').style.display  = '';
        document.getElementById('lbtn-spin').style.display = 'none';
    }
}

// ══════════════════════════════════════════════════════════════
//  ACCESO COMO CLIENTE (desde login principal)
//  Muestra el modal de registro/login de tienda sin pasar
//  por el backend de empleados. El cliente solo ve:
//  catálogo, tienda y orden de compra.
// ══════════════════════════════════════════════════════════════
function auth_loginComoCliente() {
    // Intentar recuperar sesión previa de cliente
    try {
        const saved = localStorage.getItem('tienda_cliente_actual');
        if (saved) {
            const c = JSON.parse(saved);
            if (c && c.nombre) {
                _auth_entrarComoCliente(c);
                return;
            }
        }
    } catch(e) {}

    // No hay sesión previa → mostrar modal de la tienda
    // Asegurar que la app esté visible para poder mostrar el modal
    const appDiv = document.getElementById('tpv-app');
    if (appDiv) appDiv.style.display = '';

    // Esperar a que Bootstrap esté listo y luego abrir modal
    function _abrirModal() {
        if (typeof bootstrap === 'undefined') { setTimeout(_abrirModal, 100); return; }
        const modal = document.getElementById('clienteAuthModal');
        if (!modal) { setTimeout(_abrirModal, 200); return; }

        // Escuchar cuando el cliente se autentique exitosamente
        const observer = new MutationObserver(() => {
            if (typeof TIENDA !== 'undefined' && TIENDA.clienteActual) {
                observer.disconnect();
                _auth_entrarComoCliente(TIENDA.clienteActual);
            }
        });
        if (typeof TIENDA !== 'undefined') {
            observer.observe(document.getElementById('tienda-root') || document.body,
                { childList: true, subtree: true });
        }

        // También escuchar el cierre del modal para detectar login exitoso
        modal.addEventListener('hidden.bs.modal', function onHide() {
            modal.removeEventListener('hidden.bs.modal', onHide);
            if (typeof TIENDA !== 'undefined' && TIENDA.clienteActual) {
                observer.disconnect();
                _auth_entrarComoCliente(TIENDA.clienteActual);
            }
        });

        if (typeof tienda_switchAuthTab === 'function') tienda_switchAuthTab('login');
        new bootstrap.Modal(modal).show();
    }
    _abrirModal();
}

function _auth_entrarComoCliente(clienteObj) {
    // Registrar en AUTH como rol 'cliente'
    AUTH.usuario = {
        usuario_id:    clienteObj.id || clienteObj.cliente_id || 'cli-local',
        username:      clienteObj.email || clienteObj.username || clienteObj.nombre,
        nombre:        clienteObj.nombre,
        rol:           'cliente',
        _clienteData:  clienteObj
    };

    // Si TIENDA existe, asegurar que clienteActual esté seteado
    if (typeof TIENDA !== 'undefined') TIENDA.clienteActual = clienteObj;

    _auth_mostrarApp();
}

function _loginErr(msg) {
    const d = document.getElementById('login-error');
    const m = document.getElementById('login-error-msg');
    if (d && m) { m.textContent = msg; d.style.display = 'flex'; }
}

// ══════════════════════════════════════════════════════════════
//  MOSTRAR APP TRAS LOGIN
// ══════════════════════════════════════════════════════════════
function _auth_mostrarApp() {
    // Ocultar AMBAS pantallas de login (static inline + dinámica)
    var _x = document.getElementById('login-screen-static');
    if (_x) _x.style.display = 'none';
    const ls = document.getElementById('login-screen');
    // BUGFIX: login-screen puede no existir aún si Bootstrap no terminó de cargar
    if (ls) {
        ls.style.transition = 'opacity .28s';
        ls.style.opacity    = '0';
        setTimeout(() => ls.classList.add('d-none'), 290);
    }

    const u  = AUTH.usuario;
    const ri = ROL_INFO[u.rol] || { color:'#6c757d', icono:'bi-person', label:u.rol };
    const ub = document.getElementById('user-bar');
    if (ub) ub.classList.remove('d-none');

    const icon  = document.getElementById('ub-icon');
    const name  = document.getElementById('ub-name');
    const badge = document.getElementById('ub-badge');
    if (icon)  { icon.className = `bi ${ri.icono}`; icon.style.color = ri.color; }
    if (name)  name.textContent = u.nombre;
    if (badge) {
        badge.textContent = ri.label;
        badge.style.cssText = `background:${ri.color}28;color:${ri.color};border:1px solid ${ri.color}55`;
    }

    // Botones según rol
    const btnU = document.getElementById('btn-usuarios');
    const btnL = document.getElementById('btn-licencias');
    // Usuarios: dev y admin lo ven (supervisor y vendedor solo cambian su contraseña vía el mismo modal)
    if (btnU) btnU.classList.toggle('d-none', !['desarrollador','administrador','supervisor','vendedor'].includes(u.rol));
    // Licencias: solo desarrollador
    if (btnL) btnL.classList.toggle('d-none', u.rol !== 'desarrollador');

    // Campana
    document.getElementById('notif-bell-wrap')?.classList.remove('d-none');
    _iniciarPolling();

    // Mostrar el container principal de la app
    const appDiv = document.getElementById('tpv-app');
    if (appDiv) appDiv.style.display = '';

    // Cargar app y aplicar permisos — esperar a Bootstrap si aún no cargó
    function _lanzarUI() {
        if (typeof bootstrap === 'undefined') {
            setTimeout(_lanzarUI, 100);
            return;
        }
        if (typeof loadState === 'function') {
            loadState().then(() => {
                if (typeof initializeUI    === 'function') initializeUI();
                if (typeof conf_setLanguage === 'function') conf_setLanguage(window.tpvState?.config?.lang ?? 'es');
                setTimeout(_auth_aplicarTabs, 300);
            });
        } else {
            // loadState ya corrió antes — recargar catálogo del servidor para tener datos frescos
            if (typeof catalogo_cargarDesdeServidor === 'function') {
                catalogo_cargarDesdeServidor().then(() => {
                    if (typeof tpv_renderizarProductos === 'function') tpv_renderizarProductos();
                });
            }
            if (typeof initializeUI    === 'function') initializeUI();
            if (typeof conf_setLanguage === 'function') conf_setLanguage(window.tpvState?.config?.lang ?? 'es');
            setTimeout(_auth_aplicarTabs, 300);
        }
    }
    _lanzarUI();
}

// ══════════════════════════════════════════════════════════════
//  CONTROL DE TABS POR ROL
// ══════════════════════════════════════════════════════════════
function _auth_aplicarTabs() {
    const rol = AUTH.usuario?.rol;
    if (!rol) return;

    // Si es desarrollador, mostrar historial de errores capturados
    if (rol === 'desarrollador' && typeof window._dbg_mostrar === 'function') {
        setTimeout(window._dbg_mostrar, 400);
    }

    // Aplicar visibilidad a cada tab
    Object.entries(ACCESO_TABS).forEach(([tabId, roles]) => {
        const tab = document.getElementById(tabId);
        if (!tab) return;
        const li    = tab.closest('li');
        const puede = roles.includes(rol);
        if (li) li.style.display = puede ? '' : 'none';
        else    tab.style.display = puede ? '' : 'none';
    });

    // Ocultar menús dropdown que quedaron completamente vacíos
    document.querySelectorAll('#main-nav-tabs .nav-item.dropdown').forEach(dd => {
        const items = dd.querySelectorAll('li');
        const hayVisible = [...items].some(li =>
            li.style.display !== 'none' && !li.querySelector('hr') && li.querySelector('a,button')
        );
        dd.style.display = hayVisible ? '' : 'none';
    });

    // Si la tab activa quedó oculta → ir al tab por defecto según rol
    const activePane = document.querySelector('.tab-pane.active.show');
    if (activePane) {
        const tabId  = activePane.id.replace('-pane','');
        const tabBtn = document.getElementById(tabId);
        const li     = tabBtn?.closest('li');
        if (li && li.style.display === 'none') {
            // Vendedor → inventario | Cliente → tienda | Resto → caja
            const defaultTab = rol === 'vendedor'
                ? 'inv-inventario-tab'
                : rol === 'cliente'
                    ? 'tienda-tab'
                    : 'tpv-caja-tab';
            document.getElementById(defaultTab)?.click();
        }
    }
    // Vendedor: su tab por defecto es Inventario
    if (rol === 'vendedor') {
        setTimeout(() => document.getElementById('inv-inventario-tab')?.click(), 350);
    }
    // Cliente: su tab por defecto es Tienda
    if (rol === 'cliente') {
        setTimeout(() => document.getElementById('tienda-tab')?.click(), 350);
    }

    // Sección "Mi Tienda" en Configuración: solo admin/dev
    const cfgTienda = document.getElementById('cfg-tienda-wrap');
    if (cfgTienda) cfgTienda.style.display = ['desarrollador','administrador'].includes(rol) ? '' : 'none';

    // Sección "Mantenimiento" en Configuración: solo admin/dev
    const cfgMant = document.getElementById('cfg-mant-wrap');
    if (cfgMant) cfgMant.style.display = ['desarrollador','administrador'].includes(rol) ? '' : 'none';

    // Configuraciones especiales por rol
    if (rol === 'vendedor')                                 _setup_vendedor();
    if (['administrador','desarrollador'].includes(rol))    _setup_admin_inventario();
    if (['administrador','desarrollador'].includes(rol))    cfg_cargarTienda();
    if (rol === 'cliente')                                  _setup_cliente();

    console.log(`[Auth] Tabs aplicados — rol: ${rol}`);
}

// ══════════════════════════════════════════════════════════════
//  SETUP CLIENTE
//  El cliente solo ve: Catálogo (solo lectura), Tienda y Orden
//  Oculta botones de edición en el catálogo y muestra saludo
// ══════════════════════════════════════════════════════════════
function _setup_cliente() {
    const c = AUTH.usuario?._clienteData || AUTH.usuario;

    // Renombrar tabs visibles para el cliente
    const tabCatalogo = document.getElementById('gestion-productos-tab');
    if (tabCatalogo) {
        const s = tabCatalogo.querySelector('span') || tabCatalogo;
        s.textContent = '🛍️ Catálogo';
    }
    const tabOrden = document.getElementById('orden-actual-tab');
    if (tabOrden) {
        const s = tabOrden.querySelector('span') || tabOrden;
        s.textContent = '🛒 Mi Orden';
    }

    // Ocultar botones de edición/gestión en catálogo (el cliente solo mira)
    setTimeout(() => {
        // Ocultar botones de añadir/editar/borrar productos
        ['btn-nuevo-producto','btn-importar-xlsx','btn-exportar-xlsx',
         'gestion-bulk-actions','btn-gestionar-categorias'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        // Ocultar columna de acciones en tabla de productos
        document.querySelectorAll('.col-acciones-producto, .btn-editar-prod, .btn-borrar-prod')
            .forEach(el => el.style.display = 'none');
    }, 500);

    // Actualizar barra de usuario con nombre del cliente
    const nameEl = document.getElementById('ub-name');
    if (nameEl && c?.nombre) nameEl.textContent = c.nombre;

    // Añadir botón "Cerrar sesión cliente" en la barra de usuario
    const ubActions = document.querySelector('.ub-actions');
    if (ubActions && !document.getElementById('btn-logout-cliente')) {
        const btnLogout = document.createElement('button');
        btnLogout.id = 'btn-logout-cliente';
        btnLogout.className = 'ub-btn out';
        btnLogout.innerHTML = '<i class="bi bi-box-arrow-right me-1"></i><span class="d-none d-sm-inline">Salir</span>';
        btnLogout.onclick = auth_logoutCliente;
        // Reemplazar el botón de salir del staff
        const btnSalirStaff = ubActions.querySelector('.ub-btn.out');
        if (btnSalirStaff) ubActions.replaceChild(btnLogout, btnSalirStaff);
        else ubActions.appendChild(btnLogout);
    }

    // Inicializar tienda en modo cliente
    if (typeof tienda_init === 'function') {
        setTimeout(() => tienda_init(), 400);
    }
}

function auth_logoutCliente() {
    // Limpiar sesión cliente
    try { localStorage.removeItem('tienda_cliente_actual'); } catch(e) {}
    if (typeof TIENDA !== 'undefined') TIENDA.clienteActual = null;
    AUTH.usuario = null;

    // Volver a la pantalla de login
    const appDiv = document.getElementById('tpv-app');
    if (appDiv) appDiv.style.display = 'none';
    const ub = document.getElementById('user-bar');
    if (ub) ub.classList.add('d-none');
    const ls = document.getElementById('login-screen');
    if (ls) {
        ls.style.opacity = '1';
        ls.classList.remove('d-none');
        ls.style.display = '';
    }
    // Limpiar campos
    const u = document.getElementById('login-username');
    const p = document.getElementById('login-password');
    if (u) u.value = '';
    if (p) p.value = '';
}

// ══════════════════════════════════════════════════════════════
//  SETUP INVENTARIO — VENDEDOR
//  Reemplaza el contenido de inv-inventario-tab-pane con
//  la vista de su lista diaria + columna de conteo final
// ══════════════════════════════════════════════════════════════
function _setup_vendedor() {
    const pane = document.getElementById('inv-inventario-tab-pane');
    if (!pane) return;

    const tabBtn = document.getElementById('inv-inventario-tab');
    if (tabBtn) { const s = tabBtn.querySelector('span'); if(s) s.textContent='Mi Inventario'; }

    pane.innerHTML = `
    <div class="glass-card">
      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h5 class="mb-0 fw-bold"><i class="bi bi-clipboard2-check-fill me-2 text-success"></i>Mi Inventario del Día</h5>
        <div class="d-flex gap-2 align-items-center flex-wrap">
          <input type="date" id="vend-fecha" class="form-control form-control-sm" style="width:150px" onchange="_vend_cargar()">
          <button class="btn btn-sm btn-outline-primary" onclick="_vend_cargar()"><i class="bi bi-arrow-clockwise"></i></button>
        </div>
      </div>
      <div class="alert alert-info py-2 small mb-3">
        <i class="bi bi-info-circle me-1"></i>
        Anota el <strong>Conteo Final</strong> al terminar. Los cálculos se actualizan automáticamente.
        Pulsa <strong>Guardar</strong> para conservar los datos y <strong>Cerrar Día</strong> para registrar el cierre.
      </div>
      <div class="table-responsive">
        <table class="table table-bordered table-striped text-center align-middle" style="font-size:.9rem">
          <thead class="table-dark">
            <tr>
              <th>#</th><th class="text-start">Producto</th><th>U/M</th>
              <th>C. Inicial</th><th>Vendido</th>
              <th style="background:#92400e;color:#fef9c3">C. Final</th>
              <th>I. Venta</th><th>P. Costo</th>
              <th style="color:#86efac">G. Neta</th>
            </tr>
          </thead>
          <tbody id="vend-inv-body">
            <tr><td colspan="9" class="py-4 text-muted">
              <div class="spinner-border spinner-border-sm me-2"></div>Cargando...
            </td></tr>
          </tbody>
          <tfoot class="fw-bold" style="background:#1e293b;color:#f1f5f9">
            <tr>
              <td colspan="3" class="text-end py-2">TOTALES</td>
              <td id="vt-cinicial">0</td>
              <td id="vt-vendido">0</td>
              <td id="vt-cfinal">0</td>
              <td id="vt-iventa">$0.00</td>
              <td id="vt-costo">$0.00</td>
              <td id="vt-gneta" class="text-success">$0.00</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div class="d-flex gap-2 justify-content-end mt-3 flex-wrap">
        <button class="btn btn-outline-info btn-sm fw-bold" onclick="_vend_mostrarHistorial()">
          <i class="bi bi-clock-history me-1"></i>Historial
        </button>
        <button class="btn btn-success fw-bold" onclick="_vend_guardarConteos()">
          <i class="bi bi-floppy-fill me-2"></i>Guardar Conteos
        </button>
        <button class="btn btn-warning fw-bold" onclick="_vend_cerrarDia()">
          <i class="bi bi-door-closed-fill me-2"></i>Cerrar Día
        </button>
      </div>
      <!-- Panel historial de cierres -->
      <div id="vend-historial-panel" class="mt-4 d-none">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h6 class="fw-bold mb-0"><i class="bi bi-journal-text me-2 text-info"></i>Historial de Cierres</h6>
          <button class="btn btn-sm btn-outline-secondary" onclick="document.getElementById('vend-historial-panel').classList.add('d-none')">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div id="vend-historial-body" class="text-center py-3 text-muted">
          <div class="spinner-border spinner-border-sm"></div> Cargando...
        </div>
      </div>
    </div>`;

    const fInp = document.getElementById('vend-fecha');
    if (fInp) fInp.value = new Date().toISOString().split('T')[0];
    _vend_cargar();
    _vend_cargarHistorial();
}

async function _vend_cargarHistorial() {
    const uid = AUTH.usuario.usuario_id;
    try {
        const res  = await fetch(`/api/inventario/diario/historial/${uid}`, { credentials:'same-origin' });
        const data = await res.json();
        const hist = data.historial || [];

        // Crear/buscar contenedor historial
        const pane = document.getElementById('inv-inventario-tab-pane');
        if (!pane) return;
        let hw = document.getElementById('vend-historial-wrap');
        if (!hw) {
            hw = document.createElement('div');
            hw.id = 'vend-historial-wrap';
            pane.appendChild(hw);
        }

        if (!hist.length) { hw.innerHTML = ''; return; }

        const rows = hist.map(c => `<tr>
          <td>${c.fecha}</td>
          <td class="text-primary fw-bold">$${parseFloat(c.total_ventas||0).toFixed(2)}</td>
          <td class="text-secondary">$${parseFloat(c.total_costo||0).toFixed(2)}</td>
          <td class="fw-bold ${parseFloat(c.ganancia_neta||0)>=0?'text-success':'text-danger'}">
              $${parseFloat(c.ganancia_neta||0).toFixed(2)}</td>
        </tr>`).join('');

        hw.innerHTML = `<div class="glass-card mt-3">
          <h6 class="fw-bold mb-2"><i class="bi bi-clock-history me-2 text-info"></i>Historial de Cierres</h6>
          <div class="table-responsive">
          <table class="table table-sm table-hover text-center align-middle" style="font-size:.85rem">
            <thead class="table-dark">
              <tr><th>Fecha</th><th>I.Venta</th><th>Costo</th><th>G.Neta</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table></div>
        </div>`;
    } catch(e) {}
}

let _vend_conteos = {};
let _vend_items   = [];

async function _vend_cargar() {
    const body = document.getElementById('vend-inv-body');
    if (!body) return;
    _vend_conteos = {};
    _vend_items   = [];

    const uid  = AUTH.usuario.usuario_id;
    const fInp = document.getElementById('vend-fecha');
    const hoy  = fInp?.value || new Date().toISOString().split('T')[0];

    try {
        const res  = await fetch(`/api/inventario/diario/${uid}?fecha=${hoy}`, { credentials:'same-origin' });
        const data = await res.json();
        _vend_items = data.inventario || [];

        if (!_vend_items.length) {
            body.innerHTML = `<tr><td colspan="9" class="py-5 text-muted text-center">
              <i class="bi bi-inbox" style="font-size:2rem"></i><br>Sin productos asignados para este día.
            </td></tr>`;
            _vend_totales();
            return;
        }

        body.innerHTML = _vend_items.map((p, i) => {
            const cfinal  = p.cant_final ?? (p.cant_asignada - p.cant_vendida);
            const iventa  = (p.cant_vendida) * (p.precio_venta  || 0);
            const costoT  = (p.cant_vendida) * (p.precio_costo  || 0);
            const gneta   = iventa - costoT;
            const pid     = p.producto_id;
            _vend_conteos[pid] = cfinal;
            return `<tr>
              <td>${i+1}</td>
              <td class="text-start fw-semibold">${p.nombre}</td>
              <td>${p.um || 'Un'}</td>
              <td>${p.cant_asignada}</td>
              <td class="fw-bold">${p.cant_vendida}</td>
              <td>
                <input type="number" min="0" step="0.01"
                       id="vf-${pid}"
                       class="form-control form-control-sm text-center"
                       style="width:80px;margin:auto;border:2px solid #f59e0b;font-weight:700"
                       value="${cfinal}"
                       oninput="_vend_conteos['${pid}']=+this.value;_vend_totales()">
              </td>
              <td class="money-column">$${iventa.toFixed(2)}</td>
              <td class="money-column">$${costoT.toFixed(2)}</td>
              <td class="fw-bold money-column ${gneta >= 0 ? 'text-success' : 'text-danger'}">$${gneta.toFixed(2)}</td>
            </tr>`;
        }).join('');

        _vend_totales();
    } catch(e) {
        body.innerHTML = `<tr><td colspan="9" class="text-danger py-3 text-center">Error al cargar inventario.</td></tr>`;
    }
}

function _vend_totales() {
    let tCInicial=0, tVendido=0, tCFinal=0, tIventa=0, tCosto=0, tGneta=0;
    _vend_items.forEach(p => {
        const cfinal = _vend_conteos[p.producto_id] ?? (p.cant_asignada - p.cant_vendida);
        const iv     = (p.cant_vendida) * (p.precio_venta  || 0);
        const co     = (p.cant_vendida) * (p.precio_costo  || 0);
        tCInicial += p.cant_asignada;
        tVendido  += p.cant_vendida;
        tCFinal   += parseFloat(cfinal) || 0;
        tIventa   += iv;
        tCosto    += co;
        tGneta    += iv - co;
    });
    const s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    s('vt-cinicial', tCInicial);
    s('vt-vendido',  tVendido);
    s('vt-cfinal',   parseFloat(tCFinal.toFixed(2)));
    s('vt-iventa',   '$' + tIventa.toFixed(2));
    s('vt-costo',    '$' + tCosto.toFixed(2));
    const gEl = document.getElementById('vt-gneta');
    if (gEl) { gEl.textContent = '$' + tGneta.toFixed(2); gEl.className = tGneta >= 0 ? 'text-success' : 'text-danger'; }
}

async function _vend_guardarConteos() {
    const uid     = AUTH.usuario.usuario_id;
    const cambios = Object.entries(_vend_conteos);
    if (!cambios.length) { _toast('Sin cambios pendientes.', 'info'); return; }

    let ok = 0;
    for (const [pid, cant] of cambios) {
        try {
            const r = await fetch('/api/inventario/diario/conteo', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ vendedor_id: uid, producto_id: pid, cant_final: cant })
            });
            if (r.ok) ok++;
        } catch(e) {}
    }
    _toast(`\u2705 ${ok} conteo${ok !== 1 ? 's' : ''} guardado${ok !== 1 ? 's' : ''}`, 'success');
}

async function _vend_cerrarDia() {
    const uid  = AUTH.usuario.usuario_id;
    const fInp = document.getElementById('vend-fecha');
    const hoy  = fInp?.value || new Date().toISOString().split('T')[0];

    if (!_vend_items.length) { _toast('No hay inventario para cerrar.', 'warning'); return; }
    if (!confirm(`\u00bfCerrar el d\u00eda ${hoy}?\n\nEsto registrar\u00e1 el resumen de ventas.\nAseg\u00farate de haber anotado todos los conteos finales.`)) return;

    // Guardar conteos primero
    await _vend_guardarConteos();

    // Calcular totales del cierre
    let tVentas = 0, tCosto = 0, tGneta = 0;
    _vend_items.forEach(p => {
        const iv = p.cant_vendida * (p.precio_venta  || 0);
        const co = p.cant_vendida * (p.precio_costo  || 0);
        tVentas += iv;
        tCosto  += co;
        tGneta  += iv - co;
    });

    try {
        const res  = await fetch('/api/inventario/diario/cierre', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                vendedor_id:  uid,
                fecha:        hoy,
                total_ventas: tVentas,
                total_costo:  tCosto,
                ganancia_neta: tGneta,
                items:        _vend_items.map(p => ({
                    producto_id:   p.producto_id,
                    nombre:        p.nombre,       // necesario para traspaso
                    um:            p.um || 'Un',
                    cant_asignada: p.cant_asignada,
                    cant_vendida:  p.cant_vendida,
                    cant_final:    parseFloat(_vend_conteos[p.producto_id] ?? p.cant_final ?? 0),
                    precio_venta:  p.precio_venta  || 0,
                    precio_costo:  p.precio_costo  || 0
                }))
            })
        });
        const data = await res.json();
        if (res.ok) {
            _toast(`\u2705 D\u00eda cerrado \u2014 Ventas: $${tVentas.toFixed(2)} | G.Neta: $${tGneta.toFixed(2)}`, 'success');
            _vend_items   = [];
            _vend_conteos = {};
            _vend_cargar();
        } else {
            _toast(data.error || 'Error al cerrar d\u00eda', 'danger');
        }
    } catch(e) { _toast('Error de conexi\u00f3n', 'danger'); }
}

// ══════════════════════════════════════════════════════════════
//  HISTORIAL DE CIERRES — Vendedor
// ══════════════════════════════════════════════════════════════
async function _vend_mostrarHistorial() {
    const panel = document.getElementById('vend-historial-panel');
    const body  = document.getElementById('vend-historial-body');
    if (!panel || !body) return;

    panel.classList.remove('d-none');
    body.innerHTML = '<div class="spinner-border spinner-border-sm me-2"></div>Cargando...';

    try {
        const uid = AUTH.usuario.usuario_id;
        const res  = await fetch(`/api/inventario/diario/historial/${uid}`, { credentials: 'same-origin' });
        const data = await res.json();
        const hist = data.historial || [];

        if (!hist.length) {
            body.innerHTML = '<p class="text-muted text-center py-3"><i class="bi bi-inbox me-2"></i>Sin cierres registrados.</p>';
            return;
        }

        const totalV = hist.reduce((s,c)=>s+(c.total_ventas||0),0);
        const totalC = hist.reduce((s,c)=>s+(c.total_costo||0),0);
        const totalG = totalV - totalC;
        body.innerHTML = `
        <div class="table-responsive">
          <table class="table table-sm table-hover align-middle text-center" style="font-size:.85rem">
            <thead class="table-dark">
              <tr>
                <th>Fecha</th>
                <th class="text-end">Ventas</th>
                <th class="text-end">Costo</th>
                <th class="text-end" style="color:#86efac">G.Neta</th>
                <th>Productos</th>
              </tr>
            </thead>
            <tbody>
              ${hist.map(c => {
                  const items = (() => { try { return JSON.parse(c.items_json||'[]'); } catch(e){ return []; } })();
                  const gn = (c.total_ventas||0) - (c.total_costo||0);
                  return `<tr>
                    <td class="fw-semibold">${c.fecha}</td>
                    <td class="text-end text-primary">$${(c.total_ventas||0).toFixed(2)}</td>
                    <td class="text-end text-secondary">$${(c.total_costo||0).toFixed(2)}</td>
                    <td class="text-end fw-bold ${gn>=0?'text-success':'text-danger'}">$${gn.toFixed(2)}</td>
                    <td class="text-muted">${items.length} prod.</td>
                  </tr>`;
              }).join('')}
            </tbody>
            <tfoot class="fw-bold" style="background:#1e293b;color:#f1f5f9">
              <tr>
                <td class="text-end">TOTAL (${hist.length} días)</td>
                <td class="text-end">$${totalV.toFixed(2)}</td>
                <td class="text-end">$${totalC.toFixed(2)}</td>
                <td class="text-end ${totalG>=0?'text-success':'text-danger'}">$${totalG.toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>`;
    } catch(e) {
        body.innerHTML = `<div class="alert alert-danger py-2">Error: ${e.message}</div>`;
    }
}


// ══════════════════════════════════════════════════════════════
//  INVENTARIO ADMIN — Almacén General (servidor) + Vendedores + Gastos
// ══════════════════════════════════════════════════════════════
function _setup_admin_inventario() {
    const pane = document.getElementById('inv-inventario-tab-pane');
    if (!pane || document.getElementById('inv-admin-btns')) return;

    // Ocultar contenido HTML original (inventario local de tpvState)
    [...pane.children].forEach(el => { el.style.display = 'none'; });

    const btns = document.createElement('div');
    btns.id = 'inv-admin-btns';
    btns.style.display = '';
    btns.className = 'd-flex gap-2 mb-3 flex-wrap align-items-center';
    btns.innerHTML = `
        <button class="btn btn-primary btn-sm" id="inv-btn-almacen"
                onclick="_admin_invVista('almacen')">
            <i class="bi bi-building-fill-gear me-1"></i>Almacén General
        </button>
        <button class="btn btn-outline-success btn-sm" id="inv-btn-vendedores"
                onclick="_admin_invVista('vendedores')">
            <i class="bi bi-people-fill me-1"></i>Vendedores Hoy
        </button>
        <button class="btn btn-outline-warning btn-sm" id="inv-btn-gastos"
                onclick="_admin_invVista('gastos')">
            <i class="bi bi-cash-stack me-1"></i>Gastos / Inversión
        </button>`;
    pane.insertBefore(btns, pane.firstChild);
    setTimeout(() => _admin_invVista('almacen'), 100);
}

function _admin_invVista(v) {
    const btnMap = {
        almacen:    { id:'inv-btn-almacen',    on:'btn btn-primary btn-sm',  off:'btn btn-outline-primary btn-sm' },
        vendedores: { id:'inv-btn-vendedores', on:'btn btn-success btn-sm',  off:'btn btn-outline-success btn-sm' },
        gastos:     { id:'inv-btn-gastos',     on:'btn btn-warning btn-sm',  off:'btn btn-outline-warning btn-sm' },
    };
    Object.entries(btnMap).forEach(([k, cfg]) => {
        const el = document.getElementById(cfg.id);
        if (el) el.className = v === k ? cfg.on : cfg.off;
    });
    ['inv-admin-almacen-wrap','inv-admin-vendedores-wrap','inv-admin-gastos-wrap']
        .forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });

    if      (v === 'almacen')    _admin_cargarAlmacen();
    else if (v === 'vendedores') _admin_cargarVendedores();
    else if (v === 'gastos')     _admin_cargarGastos();
}

// ── Exponer para que tpv_main.js pueda refrescar si está visible ──
window._admin_refreshAlmacenSiVisible = function() {
    const w = document.getElementById('inv-admin-almacen-wrap');
    if (w && w.style.display !== 'none') _admin_cargarAlmacen();
};

// ══════════════════════════════════════════════════════════════
//  ALMACÉN GENERAL — carga inventario_general del servidor
// ══════════════════════════════════════════════════════════════
async function _admin_cargarAlmacen() {
    const pane = document.getElementById('inv-inventario-tab-pane');
    if (!pane) return;
    let wrap = document.getElementById('inv-admin-almacen-wrap');
    if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'inv-admin-almacen-wrap';
        pane.appendChild(wrap);
    }
    wrap.style.display = '';
    wrap.innerHTML = `<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>`;

    try {
        const [resG, resU] = await Promise.all([
            fetch('/api/inventario/general', { credentials:'same-origin' }),
            fetch('/api/usuarios',            { credentials:'same-origin' })
        ]);
        const { inventario: general = [] } = await resG.json();
        const { usuarios = [] }            = await resU.json();
        const vends = usuarios.filter(u => u.rol === 'vendedor' && u.activo);
        window._adminGeneral = general;
        window._adminVends   = vends;

        const optsVend = vends.map(v =>
            `<option value="${v.usuario_id}">${v.nombre}</option>`).join('');

        let html = `
        <div class="d-flex gap-2 mb-3 flex-wrap align-items-center">
          <button class="btn btn-sm btn-success" onclick="_admin_abrirEntrada()">
            <i class="bi bi-plus-circle-fill me-1"></i>Añadir Stock
          </button>
          <button class="btn btn-sm btn-primary" id="btn-imp-cat" onclick="_admin_importarCatalogo()">
            <i class="bi bi-box-arrow-in-down me-1"></i>Importar Catálogo
          </button>
          <button class="btn btn-sm btn-info text-white" onclick="_admin_sincronizarAlCatalogo()">
            <i class="bi bi-arrow-repeat me-1"></i>Sync→Catálogo
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="_admin_limpiarInventariosUI()">
            <i class="bi bi-trash3-fill me-1"></i>Limpiar
          </button>
        </div>`;

        if (!general.length) {
            html += `<div class="alert alert-warning">
              <i class="bi bi-exclamation-triangle me-2"></i>
              El almacén está vacío.
              Use <strong>Importar Catálogo</strong> para añadir los productos del TPV,
              luego <strong>Añadir Stock</strong> para poner cantidades.
            </div>`;
        } else {
            html += `<div class="glass-card">
              <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                <h6 class="fw-bold mb-0">
                  <i class="bi bi-building-fill-gear me-1 text-primary"></i>
                  Almacén General <span class="badge bg-primary ms-1">${general.length}</span>
                </h6>
                <small class="text-muted">Elige vendedor y cantidad → <i class="bi bi-send-fill text-success"></i></small>
              </div>
              <div class="table-responsive">
              <table class="table table-sm table-hover mb-0 align-middle" style="font-size:.82rem">
                <thead class="table-primary">
                  <tr>
                    <th class="text-start">Producto</th>
                    <th>Categoría</th>
                    <th class="text-center">Stock</th>
                    <th class="text-center">P.Compra</th>
                    <th class="text-center">P.Venta</th>
                    <th style="min-width:130px">Vendedor</th>
                    <th style="min-width:80px" class="text-center">Cant.</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                ${general.map(p => {
                    const stk = parseFloat(p.stock_actual)||0;
                    const min = parseFloat(p.stock_minimo)||5;
                    const cls = stk<=0 ? 'text-danger fw-bold'
                               : stk<=min ? 'text-warning fw-bold' : 'text-success fw-bold';
                    const pid = p.producto_id;
                    return `<tr id="agn-row-${pid}">
                      <td class="fw-semibold text-start">${p.nombre}</td>
                      <td class="text-muted small">${p.categoria||'-'}</td>
                      <td class="text-center ${cls} agn-stock-cell">${stk}</td>
                      <td class="text-center text-secondary small">$${parseFloat(p.precio_compra||0).toFixed(2)}</td>
                      <td class="text-center text-primary small">$${parseFloat(p.precio_venta||0).toFixed(2)}</td>
                      <td>${vends.length
                          ? `<select class="form-select form-select-sm" id="agn-vend-${pid}" style="font-size:.78rem">${optsVend}</select>`
                          : '<span class="text-muted small">Sin vendedores</span>'}</td>
                      <td class="text-center">
                        <input type="number" id="agn-cant-${pid}"
                               class="form-control form-control-sm text-center"
                               min="0" max="${stk}" step="1" value="" placeholder="0"
                               style="width:68px;font-size:.82rem"
                               data-pid="${pid}"
                               data-nombre="${p.nombre.replace(/"/g,'&quot;')}"
                               data-pv="${p.precio_venta||0}"
                               data-pc="${p.precio_compra||0}"
                               data-stock="${stk}">
                      </td>
                      <td>
                        <button class="btn btn-sm btn-success px-2 py-1"
                                onclick="_admin_asignarUno('${pid}')"
                                title="Asignar">
                          <i class="bi bi-send-fill"></i>
                        </button>
                      </td>
                    </tr>`;
                }).join('')}
                </tbody>
              </table></div>
            </div>`;
        }
        wrap.innerHTML = html;
    } catch(e) {
        wrap.innerHTML = `<div class="alert alert-danger">Error al cargar almacén: ${e.message}</div>`;
    }
}

async function _admin_cargarVendedores() {
    const pane = document.getElementById('inv-inventario-tab-pane');
    if (!pane) return;
    let wrap = document.getElementById('inv-admin-vendedores-wrap');
    if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'inv-admin-vendedores-wrap';
        pane.appendChild(wrap);
    }
    wrap.style.display = '';

    const hoy     = new Date().toISOString().split('T')[0];
    const fechaEl = document.getElementById('inv-admin-fecha-vend');
    const fechaVer= fechaEl?.value || hoy;

    wrap.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h5 class="mb-0 fw-bold">
          <i class="bi bi-people-fill me-2 text-success"></i>Inventario Vendedores
        </h5>
        <div class="d-flex gap-2 align-items-center flex-wrap">
          <input type="date" id="inv-admin-fecha-vend"
                 class="form-control form-control-sm" style="width:148px"
                 value="${fechaVer}"
                 onchange="_admin_renderVendedores(this.value)">
          <span id="inv-vend-ts" class="text-muted small"></span>
          <button class="btn btn-sm btn-outline-secondary" onclick="_admin_cargarVendedores()">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>
      <div id="inv-vend-body">
        <div class="text-center py-4">
          <div class="spinner-border text-success me-2"></div>Cargando...
        </div>
      </div>`;

    await _admin_renderVendedores(fechaVer);

    clearInterval(window._vendPolling);
    window._vendPolling = setInterval(() => {
        const bV = document.getElementById('inv-btn-vendedores');
        if (!bV || !bV.className.includes('btn-success')) {
            clearInterval(window._vendPolling); return;
        }
        const fEl = document.getElementById('inv-admin-fecha-vend');
        _admin_renderVendedores(fEl?.value || hoy);
    }, 20000);
}

async function _admin_renderVendedores(hoy) {
    const body = document.getElementById('inv-vend-body');
    if (!body) return;
    try {
        const resU  = await fetch('/api/usuarios', { credentials:'same-origin' });
        const dataU = await resU.json();
        const vends = (dataU.usuarios||[]).filter(u => u.rol==='vendedor' && u.activo);
        window._adminVends = vends;

        let html = '';

        // ── TABLAS POR VENDEDOR ──
        let gVentas = 0, gCosto = 0, gGanancia = 0;

        if (!vends.length) {
            html += '<div class="alert alert-info">Sin vendedores activos.</div>';
        }

        for (const v of vends) {
            const resI  = await fetch(`/api/inventario/diario/${v.usuario_id}?fecha=${hoy}`, { credentials: 'same-origin' });
            const dataI = await resI.json();
            const items = dataI.inventario || [];

            const tVentas   = items.reduce((s,p) => s + (p.cant_vendida||0)*(p.precio_venta||0), 0);
            const tCosto    = items.reduce((s,p) => s + (p.cant_vendida||0)*(p.precio_costo||0), 0);
            const tGanancia = tVentas - tCosto;
            gVentas   += tVentas;
            gCosto    += tCosto;
            gGanancia += tGanancia;

            html += `<div class="glass-card mb-3" id="vend-card-${v.usuario_id}">
              <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                <span class="fw-bold fs-6">
                  <i class="bi bi-person-badge-fill me-1 text-success"></i>${v.nombre}
                  <span class="text-muted fw-normal small">@${v.username}</span>
                </span>
                <div class="d-flex gap-1 flex-wrap align-items-center">
                  <span class="badge bg-primary">$${tVentas.toFixed(2)}</span>
                  <span class="badge ${tGanancia>=0?'bg-success':'bg-danger'}">G: $${tGanancia.toFixed(2)}</span>
                  <button class="btn btn-sm btn-outline-danger px-2 py-0"
                          onclick="_admin_limpiarVendedor('${v.usuario_id}','${v.nombre}')"
                          title="Limpiar inventario de este vendedor">
                    <i class="bi bi-x-circle-fill"></i>
                  </button>
                </div>
              </div>
              ${items.length ? `<div class="table-responsive">
              <table class="table table-sm table-hover mb-0 text-center align-middle" style="font-size:.82rem">
                <thead class="table-dark">
                  <tr><th class="text-start">Producto</th><th>U/M</th><th>Asig.</th>
                      <th>Vendido</th><th>Dispon.</th><th>I.Venta</th>
                      <th style="color:#86efac">G.Neta</th></tr>
                </thead>
                <tbody>
                  ${items.map(p => {
                      const disp = (p.cant_asignada||0) - (p.cant_vendida||0);
                      const cl   = disp<=0?'text-danger':disp<=3?'text-warning':'text-success';
                      const iv   = (p.cant_vendida||0)*(p.precio_venta||0);
                      const co   = (p.cant_vendida||0)*(p.precio_costo||0);
                      const gn   = iv - co;
                      return `<tr>
                        <td class="text-start">${p.nombre}</td>
                        <td>${p.um||'Un'}</td><td>${p.cant_asignada}</td>
                        <td class="fw-bold">${p.cant_vendida}</td>
                        <td class="fw-bold ${cl}">${disp}</td>
                        <td>$${iv.toFixed(2)}</td>
                        <td class="fw-bold ${gn>=0?'text-success':'text-danger'}">$${gn.toFixed(2)}</td>
                      </tr>`;
                  }).join('')}
                </tbody>
              </table></div>` : `<p class="text-muted small py-2 mb-0">
                <i class="bi bi-inbox me-1"></i>Sin productos asignados. Usa la tabla del almacén de arriba.
              </p>`}
            </div>`;
        }

        // ── RESUMEN GLOBAL ──
        html += `<div class="glass-card" style="border:2px solid #0d6efd44;background:linear-gradient(135deg,#0d6efd0d,#19875411)">
          <h6 class="fw-bold text-center mb-3"><i class="bi bi-graph-up-arrow me-1 text-primary"></i>Resumen Global del Día</h6>
          <div class="row text-center g-2 mb-2">
            <div class="col-6 col-sm-3"><div class="text-muted small">Ingresos</div><div class="fw-bold text-primary fs-6">$${gVentas.toFixed(2)}</div></div>
            <div class="col-6 col-sm-3"><div class="text-muted small">Costo Mercanc.</div><div class="fw-bold text-secondary fs-6">$${gCosto.toFixed(2)}</div></div>
            <div class="col-6 col-sm-3"><div class="text-muted small">Gastos Operac.</div><div class="fw-bold text-warning fs-6" id="resumen-gastos-dia">$0.00</div></div>
            <div class="col-6 col-sm-3">
              <div class="text-muted small">Utilidad Real</div>
              <div class="fw-bold fs-6" id="resumen-utilidad-dia">$${gGanancia.toFixed(2)}</div>
            </div>
          </div>
          <div class="text-center"><small class="text-muted">Utilidad Real = Ingresos − Costo − Gastos</small></div>
        </div>`;

        body.innerHTML = html;

        // Gastos del día
        try {
            const rG = await fetch(`/api/gastos?fecha=${hoy}`, { credentials: 'same-origin' });
            const dG = await rG.json();
            const totalG   = (dG.gastos || []).reduce((s,g) => s + (g.monto||0), 0);
            const utilReal = gGanancia - totalG;
            const elG = document.getElementById('resumen-gastos-dia');
            const elU = document.getElementById('resumen-utilidad-dia');
            if (elG) elG.textContent = '$' + totalG.toFixed(2);
            if (elU) {
                elU.textContent = '$' + utilReal.toFixed(2);
                elU.className   = 'fw-bold fs-6 ' + (utilReal >= 0 ? 'text-success' : 'text-danger');
            }
        } catch(e) {}

        const ts = document.getElementById('inv-vend-ts');
        if (ts) ts.textContent = 'Actualizado: ' + new Date().toLocaleTimeString();

    } catch(e) {
        if (body) body.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
    }
}

/** Asigna un producto del almacén general a un vendedor directamente */
async function _admin_asignarUno(pid) {
    const vendEl = document.getElementById(`agn-vend-${pid}`);
    const cantEl = document.getElementById(`agn-cant-${pid}`);
    if (!vendEl || !cantEl) return;

    const vendedor_id = vendEl.value;
    const cantidad    = parseFloat(cantEl.value) || 0;
    const stock       = parseFloat(cantEl.dataset.stock) || 0;
    const nombre      = cantEl.dataset.nombre || pid;
    const pv          = parseFloat(cantEl.dataset.pv) || 0;
    const pc          = parseFloat(cantEl.dataset.pc) || 0;

    if (!vendedor_id) { alert('Selecciona un vendedor'); return; }
    if (cantidad <= 0) { alert('Ingresa una cantidad mayor a 0'); cantEl.focus(); return; }
    if (cantidad > stock) { alert(`Stock insuficiente. Disponible: ${stock}`); return; }

    const btn = document.querySelector(`#agn-row-${pid} button`);
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>'; }

    try {
        const res = await fetch('/api/inventario/asignar-diario', {
            method: 'POST', credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                vendedor_id,
                productos: [{ producto_id: pid, nombre, cant_asignada: cantidad, precio_venta: pv, precio_costo: pc }]
            })
        });
        const data = await res.json();
        if (data.ok) {
            const stockCl = document.querySelector(`#agn-row-${pid} .agn-stock-cell`);
            if (stockCl) {
                const newStock = stock - cantidad;
                stockCl.textContent = newStock;
                stockCl.className   = `text-center fw-bold agn-stock-cell ${newStock <= 0 ? 'text-danger' : newStock <= 5 ? 'text-warning' : 'text-success'}`;
                cantEl.dataset.stock = newStock;
                cantEl.max = newStock;
                cantEl.value = '';
            }
            cantEl.value = '';
            const hoy = document.getElementById('inv-admin-fecha-vend')?.value || new Date().toISOString().split('T')[0];
            _admin_actualizarTarjetaVendedor(vendedor_id, hoy);
            if (typeof showToast === 'function') showToast(`✅ ${cantidad} × ${nombre} asignado`, 'success');
        } else {
            alert('Error: ' + (data.errores?.[0] || data.mensaje || 'No se pudo asignar'));
        }
    } catch(e) {
        alert('Error de red: ' + e.message);
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-send-fill"></i>'; }
    }
}

/** Actualiza solo la tarjeta de un vendedor específico sin recargar todo */
async function _admin_actualizarTarjetaVendedor(vendedor_id, fecha) {
    const card = document.getElementById(`vend-card-${vendedor_id}`);
    if (!card) return;
    const vend = (window._adminVends || []).find(v => v.usuario_id === vendedor_id);
    if (!vend) return;

    try {
        const res   = await fetch(`/api/inventario/diario/${vendedor_id}?fecha=${fecha}`, { credentials: 'same-origin' });
        const data  = await res.json();
        const items = data.inventario || [];

        const tVentas   = items.reduce((s,p) => s + (p.cant_vendida||0)*(p.precio_venta||0), 0);
        const tGanancia = tVentas - items.reduce((s,p) => s + (p.cant_vendida||0)*(p.precio_costo||0), 0);
        const badges = card.querySelector('.d-flex.gap-1');
        if (badges) badges.innerHTML = `
          <span class="badge bg-primary">$${tVentas.toFixed(2)}</span>
          <span class="badge ${tGanancia>=0?'bg-success':'bg-danger'}">G: $${tGanancia.toFixed(2)}</span>
          <button class="btn btn-sm btn-outline-danger px-2 py-0"
                  onclick="_admin_limpiarVendedor('${vendedor_id}','${vend.nombre}')"
                  title="Limpiar inventario de este vendedor">
            <i class="bi bi-x-circle-fill"></i>
          </button>`;

        if (!items.length) return;
        const rows = items.map(p => {
            const disp = (p.cant_asignada||0) - (p.cant_vendida||0);
            const cl   = disp<=0?'text-danger':disp<=3?'text-warning':'text-success';
            const iv   = (p.cant_vendida||0)*(p.precio_venta||0);
            const gn   = iv - (p.cant_vendida||0)*(p.precio_costo||0);
            return `<tr><td class="text-start">${p.nombre}</td><td>${p.um||'Un'}</td>
              <td>${p.cant_asignada}</td><td class="fw-bold">${p.cant_vendida}</td>
              <td class="fw-bold ${cl}">${disp}</td><td>$${iv.toFixed(2)}</td>
              <td class="fw-bold ${gn>=0?'text-success':'text-danger'}">$${gn.toFixed(2)}</td></tr>`;
        }).join('');

        const tbody = card.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = rows;
        } else {
            const pEmpty = card.querySelector('p.text-muted');
            if (pEmpty) pEmpty.outerHTML = `<div class="table-responsive">
              <table class="table table-sm table-hover mb-0 text-center align-middle" style="font-size:.82rem">
                <thead class="table-dark"><tr>
                  <th class="text-start">Producto</th><th>U/M</th><th>Asig.</th>
                  <th>Vendido</th><th>Dispon.</th><th>I.Venta</th>
                  <th style="color:#86efac">G.Neta</th>
                </tr></thead><tbody>${rows}</tbody>
              </table></div>`;
        }
    } catch(e) { /* silencioso */ }
}

/** Limpiar inventario de un vendedor específico */
async function _admin_limpiarVendedor(vendedor_id, nombre) {
    if (!confirm(`⚠️ ¿Eliminar todo el inventario diario de ${nombre}?

Esto NO afecta el almacén general.`)) return;
    try {
        const res  = await fetch('/api/inventario/diario/limpiar', {
            method: 'POST', credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vendedor_id })
        });
        const data = await res.json();
        if (data.ok) {
            if (typeof showToast === 'function') showToast(`🗑️ Inventario de ${nombre} limpiado`, 'warning');
            const hoy = document.getElementById('inv-admin-fecha-vend')?.value || new Date().toISOString().split('T')[0];
            _admin_renderVendedores(hoy);
        } else { alert('Error: ' + data.mensaje); }
    } catch(e) { alert('Error: ' + e.message); }
}

/** Diálogo para limpiar inventarios globalmente */
function _admin_limpiarInventariosUI() {
    const hoy = new Date().toISOString().split('T')[0];
    const opc = prompt(`🗑️ LIMPIAR INVENTARIOS DIARIOS\n\n1 — Solo inventarios de HOY (${hoy})\n2 — Todos los inventarios (todos los días)\n\nEl almacén general NO se modifica.\nEscribe 1 o 2:`);
    if (!opc) return;
    let payload = {};
    if (opc.trim() === '1') payload = { fecha: hoy };
    else if (opc.trim() === '2') payload = {};
    else { alert('Opción inválida'); return; }
    const desc = opc.trim() === '1' ? `los inventarios de HOY (${hoy})` : 'TODOS los inventarios';
    if (!confirm(`⛔ ¿Confirmar eliminación de ${desc}?\n\nLos vendedores quedarán sin stock asignado.`)) return;
    fetch('/api/inventario/diario/limpiar', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(r => r.json()).then(data => {
        if (data.ok) {
            if (typeof showToast === 'function') showToast(`✅ ${data.mensaje}`, 'success');
            const fechaEl = document.getElementById('inv-admin-fecha-vend');
            _admin_renderVendedores(fechaEl?.value || hoy);
        } else { alert('Error: ' + data.mensaje); }
    }).catch(e => alert('Error: ' + e.message));
}

// ══════════════════════════════════════════════
//  GASTOS / INVERSIÓN (Admin)
// ══════════════════════════════════════════════
let _gastos = [];

async function _admin_cargarGastos() {
    const pane = document.getElementById('inv-inventario-tab-pane');
    if (!pane) return;

    let wrap = document.getElementById('inv-admin-gastos-wrap');
    if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'inv-admin-gastos-wrap';
        wrap.className = 'mt-0';
        pane.appendChild(wrap);
    }
    wrap.style.display = '';

    // Cargar gastos del servidor — filtrar por mes actual
    try {
        const hoy      = new Date().toISOString().split('T')[0];
        const mesInicio = hoy.slice(0,7) + '-01';
        const res  = await fetch(`/api/gastos?desde=${mesInicio}&hasta=${hoy}`, { credentials: 'same-origin' });
        const data = await res.json();
        _gastos = data.gastos || [];
    } catch(e) { _gastos = []; }

    _admin_renderGastos();
}

function _admin_renderGastos() {
    const wrap = document.getElementById('inv-admin-gastos-wrap');
    if (!wrap) return;

    const totalGastos = _gastos.reduce((s,g) => s + parseFloat(g.monto||0), 0);

    wrap.innerHTML = `
    <div class="glass-card mb-3">
      <h5 class="fw-bold mb-3"><i class="bi bi-cash-stack me-2 text-warning"></i>Registro de Gastos e Inversión</h5>

      <!-- Formulario nuevo gasto -->
      <div class="card mb-4">
        <div class="card-body">
          <h6 class="fw-bold mb-3"><i class="bi bi-plus-circle me-1 text-success"></i>Registrar Gasto</h6>
          <div class="row g-2">
            <div class="col-12 col-md-4">
              <label class="form-label small fw-semibold">Descripción *</label>
              <input type="text" id="gasto-desc" class="form-control form-control-sm" placeholder="Ej: Compra de productos">
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label small fw-semibold">Monto *</label>
              <input type="number" id="gasto-monto" class="form-control form-control-sm" min="0" step="0.01" placeholder="0.00">
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label small fw-semibold">Categoría</label>
              <select id="gasto-cat" class="form-select form-select-sm">
                <option>Compras</option>
                <option>Transporte</option>
                <option>Servicios</option>
                <option>Salarios</option>
                <option>Mantenimiento</option>
                <option>Marketing</option>
                <option>Otros</option>
              </select>
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label small fw-semibold">Fecha</label>
              <input type="date" id="gasto-fecha" class="form-control form-control-sm"
                     value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="col-6 col-md-2 d-flex align-items-end">
              <button class="btn btn-success btn-sm w-100" onclick="_admin_guardarGasto()">
                <i class="bi bi-floppy-fill me-1"></i>Guardar
              </button>
            </div>
          </div>
          <div class="mt-2">
            <label class="form-label small fw-semibold">Nota (opcional)</label>
            <input type="text" id="gasto-nota" class="form-control form-control-sm" placeholder="Detalles adicionales">
          </div>
        </div>
      </div>

      <!-- Resumen -->
      <div class="row g-3 mb-3">
        <div class="col-6 col-md-3">
          <div class="card text-center border-warning">
            <div class="card-body py-2">
              <div class="text-muted small">Total Gastos</div>
              <div class="fw-bold text-warning fs-5">$${totalGastos.toFixed(2)}</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card text-center border-danger">
            <div class="card-body py-2">
              <div class="text-muted small">Total Inversión</div>
              <div class="fw-bold text-danger fs-5" id="inv-total-inversion">$${totalGastos.toFixed(2)}</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card text-center border-info">
            <div class="card-body py-2">
              <div class="text-muted small">Registros</div>
              <div class="fw-bold text-info fs-5">${_gastos.length}</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card text-center border-secondary">
            <div class="card-body py-2">
              <div class="text-muted small">Filtrar mes</div>
              <input type="month" id="gasto-filtro-mes" class="form-control form-control-sm"
                     value="${new Date().toISOString().slice(0,7)}"
                     onchange="_admin_renderGastosFiltrados()">
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla gastos -->
      <div class="table-responsive">
        <table class="table table-sm table-hover align-middle" style="font-size:.85rem">
          <thead class="table-warning">
            <tr><th>#</th><th>Fecha</th><th>Descripción</th><th>Categoría</th>
                <th class="text-end">Monto</th><th>Nota</th><th></th></tr>
          </thead>
          <tbody id="gastos-tabla-body">
            ${_admin_gastosFilas(_gastos)}
          </tbody>
          <tfoot class="table-secondary fw-bold">
            <tr>
              <td colspan="4" class="text-end">TOTAL</td>
              <td class="text-end text-warning">$${totalGastos.toFixed(2)}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>`;
}

function _admin_gastosFilas(lista) {
    if (!lista.length) return '<tr><td colspan="7" class="text-center text-muted py-3">Sin gastos registrados.</td></tr>';
    return lista.map((g, i) => `<tr>
      <td>${i+1}</td>
      <td>${g.fecha}</td>
      <td class="fw-semibold">${g.descripcion}</td>
      <td><span class="badge bg-secondary">${g.categoria||'Otros'}</span></td>
      <td class="text-end fw-bold text-warning">$${parseFloat(g.monto||0).toFixed(2)}</td>
      <td class="text-muted small">${g.nota||''}</td>
      <td><button class="btn btn-sm btn-outline-danger py-0" onclick="_admin_eliminarGasto('${g.gasto_id}')">
            <i class="bi bi-trash"></i></button></td>
    </tr>`).join('');
}

async function _admin_renderGastosFiltrados() {
    const mes = document.getElementById('gasto-filtro-mes')?.value;
    if (mes) {
        try {
            const inicio = mes + '-01';
            const fin    = new Date(mes.slice(0,4), parseInt(mes.slice(5,7)), 0)
                               .toISOString().split('T')[0];
            const res  = await fetch(`/api/gastos?desde=${inicio}&hasta=${fin}`, { credentials:'same-origin' });
            const data = await res.json();
            _gastos = data.gastos || [];
        } catch(e) {}
    }
    const filtrados = mes ? _gastos.filter(g => g.fecha?.startsWith(mes)) : _gastos;
    const body = document.getElementById('gastos-tabla-body');
    if (body) body.innerHTML = _admin_gastosFilas(filtrados);
    const total = filtrados.reduce((s,g) => s + parseFloat(g.monto||0), 0);
    const inv = document.getElementById('inv-total-inversion');
    if (inv) inv.textContent = '$' + total.toFixed(2);
}

async function _admin_guardarGasto() {
    const desc  = document.getElementById('gasto-desc')?.value.trim();
    const monto = parseFloat(document.getElementById('gasto-monto')?.value) || 0;
    const cat   = document.getElementById('gasto-cat')?.value || 'Otros';
    const fecha = document.getElementById('gasto-fecha')?.value || new Date().toISOString().split('T')[0];
    const nota  = document.getElementById('gasto-nota')?.value.trim() || '';

    if (!desc)   return _toast('La descripción es obligatoria.', 'warning');
    if (monto<=0) return _toast('El monto debe ser mayor a 0.', 'warning');

    try {
        const res  = await fetch('/api/gastos', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            credentials: 'same-origin',
            body: JSON.stringify({ descripcion:desc, monto, categoria:cat, fecha, nota })
        });
        const data = await res.json();
        if (res.ok) {
            _toast('✅ Gasto registrado', 'success');
            // Limpiar formulario
            ['gasto-desc','gasto-monto','gasto-nota'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            await _admin_cargarGastos();
        } else {
            _toast(data.error || 'Error al guardar', 'danger');
        }
    } catch(e) { _toast('Error de conexión', 'danger'); }
}

async function _admin_eliminarGasto(gasto_id) {
    if (!confirm('¿Eliminar este gasto?')) return;
    try {
        const res = await fetch(`/api/gastos/${gasto_id}`, { method:'DELETE', credentials:'same-origin' });
        if (res.ok) { _toast('Gasto eliminado', 'success'); await _admin_cargarGastos(); }
    } catch(e) {}
}


// ══════════════════════════════════════════════════════════════
//  CONFIGURACIÓN DE TIENDA (Admin / Desarrollador)
// ══════════════════════════════════════════════════════════════
let _cfg_tienda_id = null;

async function cfg_cargarTienda() {
    try {
        const res  = await fetch('/api/tiendas', { credentials: 'same-origin' });
        const data = await res.json();
        const uid  = AUTH.usuario?.usuario_id;
        const t    = (data.tiendas || []).find(x => x.admin_id === uid) || (data.tiendas || [])[0];
        if (!t) return;
        _cfg_tienda_id = t.tienda_id;
        const inp = document.getElementById('cfg-tienda-nombre');
        if (inp) inp.value = t.nombre || '';
        if (t.imagen) {
            const img  = document.getElementById('cfg-tienda-img-el');
            const wrap = document.getElementById('cfg-tienda-img-wrap');
            if (img && wrap) { img.src = t.imagen; wrap.classList.remove('d-none'); }
        }
    } catch(e) {}
}

function cfg_previewTienda(input) {
    const file = input?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const img  = document.getElementById('cfg-tienda-img-el');
        const wrap = document.getElementById('cfg-tienda-img-wrap');
        if (img && wrap) { img.src = e.target.result; wrap.classList.remove('d-none'); }
    };
    reader.readAsDataURL(file);
}

function cfg_quitarImgTienda() {
    const img  = document.getElementById('cfg-tienda-img-el');
    const wrap = document.getElementById('cfg-tienda-img-wrap');
    if (img)  img.src = '';
    if (wrap) wrap.classList.add('d-none');
    const inp = document.getElementById('cfg-tienda-img-file');
    if (inp)  inp.value = '';
}

async function cfg_guardarTienda() {
    // Solo administrador y desarrollador pueden cambiar la tienda
    const rol = AUTH.usuario?.rol;
    if (!['administrador','desarrollador'].includes(rol)) {
        _toast('Solo el Administrador puede cambiar la tienda.', 'warning');
        return;
    }
    const nombre = document.getElementById('cfg-tienda-nombre')?.value?.trim();
    const imgEl  = document.getElementById('cfg-tienda-img-el');
    const imagen = imgEl?.src && !imgEl.src.startsWith(window.location.href) ? imgEl.src : null;

    if (!nombre) { _toast('Escribe el nombre de la tienda.', 'warning'); return; }
    try {
        const esNueva = !_cfg_tienda_id;
        const url     = esNueva ? '/api/tiendas' : `/api/tiendas/${_cfg_tienda_id}`;
        const method  = esNueva ? 'POST' : 'PATCH';
        const body    = { nombre };
        if (imagen) body.imagen = imagen;

        const res  = await fetch(url, {
            method, headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (res.ok) {
            _toast('\u2705 Tienda guardada', 'success');
            _cfg_tienda_id = data.tienda_id || _cfg_tienda_id;
        } else {
            _toast(data.error || 'Error al guardar', 'danger');
        }
    } catch(e) { _toast('Error de conexi\u00f3n', 'danger'); }
}

// Preview imagen producto (modal gestión)
function g_previewImg(input) {
    const file = input?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const img  = document.getElementById('g-img-el');
        const wrap = document.getElementById('g-img-wrap');
        if (img && wrap) { img.src = e.target.result; wrap.classList.remove('d-none'); }
    };
    reader.readAsDataURL(file);
}

function g_quitarImg() {
    const img  = document.getElementById('g-img-el');
    const wrap = document.getElementById('g-img-wrap');
    if (img)  img.src = '';
    if (wrap) wrap.classList.add('d-none');
    const inp = document.getElementById('gestion-producto-imagen-local');
    if (inp)  inp.value = '';
}

async function auth_logout() {
    if (!confirm('¿Cerrar sesión?')) return;
    try { await fetch('/api/auth/logout', { method:'POST' }); } catch(e) {}

    clearInterval(AUTH.pollingNotif);
    AUTH.pollingNotif = null;
    AUTH.usuario      = null;
    _prevN = -1;

    document.getElementById('user-bar')?.classList.add('d-none');
    document.getElementById('notif-bell-wrap')?.classList.add('d-none');

    // Restaurar tabs ocultos para el próximo login
    document.querySelectorAll('#main-nav-tabs li, #main-nav-tabs .nav-item').forEach(el => {
        el.style.display = '';
    });

    const ls = document.getElementById('login-screen');
    if (ls) {
        ls.classList.remove('d-none');
        ls.style.opacity = '0';
        requestAnimationFrame(() => { ls.style.transition = 'opacity .28s'; ls.style.opacity = '1'; });
    } else {
        // Si login-screen dinámico no existe, mostrar el estático
        var _sx = document.getElementById('login-screen-static');
        if (_sx) _sx.style.display = 'flex';
    }

    // Ocultar container principal
    const appDiv = document.getElementById('tpv-app');
    if (appDiv) appDiv.style.display = 'none';

    document.getElementById('login-error').style.display  = 'none';
    document.getElementById('login-hint').style.display   = 'none';
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-username').focus();
}

// ══════════════════════════════════════════════════════════════
//  CAMPANA — POLLING PEDIDOS (cada 8 s)
// ══════════════════════════════════════════════════════════════
let _prevN = -1;

function _iniciarPolling() {
    if (AUTH.pollingNotif) return;
    _prevN = -1;
    AUTH.pollingNotif = setInterval(_pollPedidos, 8000);
    _pollPedidos();
}

async function _pollPedidos() {
    if (!AUTH.usuario) return;
    try {
        const r    = await fetch('/api/pedidos?estado=pendiente', { signal: AbortSignal.timeout(4000) });
        if (!r.ok) return;
        const data = await r.json();
        const n    = (data.pedidos || []).length;

        const badge = document.getElementById('bell-badge');
        const btn   = document.querySelector('.bell-btn');
        if (badge) { badge.textContent = n; badge.classList.toggle('d-none', n === 0); }
        if (btn)   btn.classList.toggle('ring', n > 0);

        const tb = document.getElementById('tienda-pedidos-badge');
        if (tb) { tb.textContent = n; tb.classList.toggle('d-none', n === 0); }

        if (_prevN >= 0 && n > _prevN) _toastPedido(n - _prevN);
        _prevN = n;
    } catch(e) {}
}

function _toastPedido(cant) {
    document.querySelector('.toast-ped')?.remove();
    const t = document.createElement('div');
    t.className = 'toast-ped';
    t.innerHTML = `<div style="font-size:1.7rem">🔔</div>
        <div><div class="fw-bold">${cant} pedido${cant>1?'s':''} nuevo${cant>1?'s':''}</div>
        <div class="text-muted" style="font-size:.82rem">Toca para ver</div></div>
        <button onclick="this.closest('.toast-ped').remove();document.getElementById('tienda-tab')?.click()"
                style="background:none;border:none;cursor:pointer;font-size:1.1rem;color:#94a3b8">✕</button>`;
    document.body.appendChild(t);
    setTimeout(() => t?.remove(), 7000);
}

async function auth_verNotificaciones() {
    const body = document.getElementById('notif-body');
    if (body) body.innerHTML = '<div class="text-center py-3 text-muted"><div class="spinner-border spinner-border-sm me-2"></div></div>';
    new bootstrap.Modal(document.getElementById('modal-notif')).show();
    try {
        const r   = await fetch('/api/pedidos?estado=pendiente');
        const d   = await r.json();
        const ped = d.pedidos || [];
        if (!ped.length) {
            body.innerHTML = '<div class="text-center py-4 text-success"><i class="bi bi-check-circle-fill" style="font-size:2rem"></i><br><br>Sin pedidos pendientes</div>';
            return;
        }
        body.innerHTML = ped.map(p => `
        <div class="d-flex justify-content-between align-items-center p-2 mb-2
                    rounded-3 bg-warning bg-opacity-10 border border-warning border-opacity-25">
            <div>
                <div class="fw-bold">🛒 #${(p.pedido_id||p.id||'').toString().slice(-6)}</div>
                <div class="text-muted small">${p.cliente_nombre||'Cliente'} · ${(p.items||[]).length} art.</div>
            </div>
            <div class="text-end">
                <div class="fw-bold text-success">$${parseFloat(p.total||0).toFixed(2)}</div>
                <div class="text-muted small">${new Date(p.fecha||Date.now()).toLocaleTimeString()}</div>
            </div>
        </div>`).join('');
    } catch(e) {
        if (body) body.innerHTML = '<div class="alert alert-danger">Error al cargar.</div>';
    }
}

// ══════════════════════════════════════════════════════════════
//  GESTIÓN DE USUARIOS
// ══════════════════════════════════════════════════════════════
function auth_abrirUsuarios() {
    const rol = AUTH.usuario?.rol;
    // Roles que puede crear cada uno
    const puede = {
        desarrollador: ['administrador','supervisor','vendedor'],
        administrador: ['supervisor','vendedor'],
        supervisor:    [],
        vendedor:      []
    };
    const roles = puede[rol] || [];

    const sel = document.getElementById('nu-rol');
    if (sel) {
        sel.innerHTML = '<option value="">— Seleccionar —</option>' +
            roles.map(r => `<option value="${r}">${ROL_INFO[r]?.label||r}</option>`).join('');
    }

    // Ocultar tab "Crear" si no puede crear
    document.getElementById('ut-crear-li')?.classList.toggle('d-none', roles.length === 0);

    auth_tab('lista');
    new bootstrap.Modal(document.getElementById('modal-usuarios')).show();
    _cargarUsuarios();
}

function auth_tab(t) {
    [['lista','up-lista','ut-lista'],
     ['crear','up-crear','ut-crear'],
     ['pw',   'up-pw',   'ut-pw']].forEach(([k, p, b]) => {
        document.getElementById(p)?.classList.toggle('d-none', k !== t);
        document.getElementById(b)?.classList.toggle('active', k === t);
    });
}

async function _cargarUsuarios() {
    const body = document.getElementById('u-lista-body');
    if (!body) return;
    body.innerHTML = '<div class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm me-2"></div>Cargando...</div>';
    try {
        const res  = await fetch('/api/usuarios', { credentials:'same-origin' });
        const data = await res.json();
        if (!res.ok) { body.innerHTML = `<div class="alert alert-warning">${data.error||'Sin acceso'}</div>`; return; }
        const usuarios = data.usuarios || [];
        if (!usuarios.length) {
            body.innerHTML = '<div class="text-center py-4 text-muted">No hay usuarios creados aún.</div>';
            return;
        }
        body.innerHTML = usuarios.map(u => {
            const ri = ROL_INFO[u.rol] || { color:'#6c757d', label:u.rol, icono:'bi-person' };
            return `
            <div class="u-card">
                <div class="d-flex align-items-center gap-2">
                    <i class="bi ${ri.icono}" style="color:${ri.color};font-size:1.25rem;flex-shrink:0"></i>
                    <div>
                        <div class="fw-semibold">${u.nombre}</div>
                        <div class="text-muted small">@${u.username}${u.ultimo_acceso?` · ${u.ultimo_acceso}`:''}</div>
                    </div>
                </div>
                <div class="d-flex align-items-center gap-2 flex-shrink-0">
                    <span class="u-pill" style="background:${ri.color}22;color:${ri.color};border:1px solid ${ri.color}55">
                        ${ri.label}
                    </span>
                    <button class="btn btn-sm btn-outline-danger" title="Desactivar"
                            onclick="auth_desactivar('${u.usuario_id}','${u.nombre.replace(/'/g,"\\'")}')">
                        <i class="bi bi-person-x-fill"></i>
                    </button>
                </div>
            </div>`;
        }).join('');
    } catch(e) {
        body.innerHTML = '<div class="alert alert-danger">Error de conexión.</div>';
    }
}

async function auth_crearUsuario() {
    const nombre = document.getElementById('nu-nombre')?.value.trim();
    const user   = document.getElementById('nu-user')?.value.trim();
    const pw     = document.getElementById('nu-pw')?.value;
    const rol    = document.getElementById('nu-rol')?.value;
    if (!nombre || !user || !pw || !rol) { _toast('Completa todos los campos.','warning'); return; }
    try {
        const res  = await fetch('/api/usuarios/crear', {
            method:'POST', headers:{'Content-Type':'application/json'},
            credentials:'same-origin',
            body: JSON.stringify({ nombre, username:user, password:pw, rol })
        });
        const data = await res.json();
        if (res.ok && data.ok) {
            _toast(`✅ Usuario "${user}" creado.`,'success');
            ['nu-nombre','nu-user','nu-pw'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
            document.getElementById('nu-rol').value = '';
            auth_tab('lista'); _cargarUsuarios();
        } else _toast(data.error||'Error al crear.','danger');
    } catch(e) { _toast('Error de conexión.','danger'); }
}

async function auth_desactivar(id, nombre) {
    if (!confirm(`¿Desactivar a "${nombre}"?\nNo podrá iniciar sesión.`)) return;
    try {
        const res  = await fetch(`/api/usuarios/${id}`, { method:'DELETE', credentials:'same-origin' });
        const data = await res.json();
        if (res.ok) { _toast(`✅ "${nombre}" desactivado.`,'success'); _cargarUsuarios(); }
        else _toast(data.error||'Error.','danger');
    } catch(e) { _toast('Error de conexión.','danger'); }
}

async function auth_cambiarPw() {
    const act = document.getElementById('pw-act')?.value;
    const nw  = document.getElementById('pw-new')?.value;
    const con = document.getElementById('pw-con')?.value;
    if (!act || !nw || !con) { _toast('Completa todos los campos.','warning'); return; }
    if (nw !== con) { _toast('Las contraseñas nuevas no coinciden.','warning'); return; }
    if (nw.length < 4) { _toast('Mínimo 4 caracteres.','warning'); return; }
    try {
        const res  = await fetch('/api/auth/cambiar-password', {
            method:'POST', headers:{'Content-Type':'application/json'},
            credentials:'same-origin',
            body: JSON.stringify({ password_actual:act, password_nueva:nw })
        });
        const data = await res.json();
        if (res.ok && data.ok) {
            _toast('✅ Contraseña cambiada.','success');
            ['pw-act','pw-new','pw-con'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
        } else _toast(data.error||'Error.','danger');
    } catch(e) { _toast('Error de conexión.','danger'); }
}

function _toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type);
    else console.log('[Toast]', msg);
}

// ══════════════════════════════════════════════════════════════
//  LICENCIAS (solo Desarrollador)
// ══════════════════════════════════════════════════════════════
const _LIC_DIAS = { diaria:1, mensual:30, anual:365, ilimitada:99999 };

function lic_abrir() {
    lic_tab('lista');
    new bootstrap.Modal(document.getElementById('modal-licencias')).show();
    _lic_cargarLista();
    _lic_cargarAdmins();
}

function lic_tab(t) {
    [['lista','lp-lista','lt-lista'],
     ['crear','lp-crear','lt-crear']].forEach(([k,p,b]) => {
        document.getElementById(p)?.classList.toggle('d-none', k!==t);
        document.getElementById(b)?.classList.toggle('active', k===t);
    });
}

function lic_actualizarDias() {
    const tipo = document.getElementById('lic-tipo')?.value;
    const dias = document.getElementById('lic-dias');
    if (!dias) return;
    const val = _LIC_DIAS[tipo];
    if (val)  { dias.value = val; dias.disabled = (tipo !== 'personalizada'); }
    else        dias.disabled = false;
}

async function _lic_cargarAdmins() {
    try {
        const res  = await fetch('/api/usuarios', { credentials:'same-origin' });
        const data = await res.json();
        const lista = document.getElementById('lic-admin-lista');
        if (!lista) return;
        const admins = (data.usuarios||[]).filter(u => u.rol==='administrador');
        lista.innerHTML = admins.length
            ? admins.map(a => `
                <button type="button" class="list-group-item list-group-item-action py-1 small"
                        onclick="document.getElementById('lic-admin-id').value='${a.usuario_id}';
                                 document.getElementById('lic-admin-lista').innerHTML=''">
                    <strong>${a.nombre}</strong>
                    <span class="text-muted ms-1">@${a.username}</span>
                    <code class="float-end text-muted" style="font-size:.68rem">${a.usuario_id}</code>
                </button>`).join('')
            : '<div class="list-group-item text-muted small">Sin administradores registrados.</div>';
    } catch(e) {}
}

async function _lic_cargarLista() {
    const body = document.getElementById('lic-lista-body');
    if (!body) return;
    body.innerHTML = '<div class="text-center py-3"><div class="spinner-border spinner-border-sm"></div></div>';
    try {
        const res  = await fetch('/api/licencias', { credentials:'same-origin' });
        const data = await res.json();
        const lics = data.licencias || [];
        if (!lics.length) {
            body.innerHTML = '<div class="text-center text-muted py-4"><i class="bi bi-key" style="font-size:2rem"></i><br>Sin licencias generadas.</div>';
            return;
        }
        const hoy = new Date().toISOString().split('T')[0];
        body.innerHTML = lics.map(l => {
            const ilim  = l.tipo === 'ilimitada';
            const venc  = !ilim && l.fecha_expira < hoy;
            const color = ilim ? '#7c3aed' : venc ? '#dc2626' : '#059669';
            const icono = ilim ? '♾️' : venc ? '❌' : '✅';
            return `
            <div class="d-flex justify-content-between align-items-start p-2 mb-2 rounded-3"
                 style="background:${color}0f;border:1px solid ${color}33">
                <div>
                    <div class="fw-bold">${icono} ${l.admin_nombre}
                        <span class="badge ms-1 text-white" style="background:${color};font-size:.62rem">${l.tipo.toUpperCase()}</span>
                    </div>
                    <div class="text-muted small">
                        ${l.fecha_inicio} → ${ilim ? '∞ Ilimitada' : l.fecha_expira}
                        &nbsp;·&nbsp;<code style="font-size:.68rem">${l.licencia_id}</code>
                    </div>
                    ${l.notas ? `<div class="text-muted small fst-italic">${l.notas}</div>` : ''}
                </div>
                <button class="btn btn-sm btn-outline-danger ms-2 flex-shrink-0" title="Revocar"
                        onclick="lic_revocar('${l.licencia_id}','${l.admin_nombre.replace(/'/g,"\\'")}')">
                    <i class="bi bi-x-circle-fill"></i>
                </button>
            </div>`;
        }).join('');
    } catch(e) {
        body.innerHTML = '<div class="alert alert-danger">Error al cargar.</div>';
    }
}

// SHA-256 helper
const _lic_sha256 = async (text) =>
    Array.from(new Uint8Array(await crypto.subtle.digest(
        'SHA-256', new TextEncoder().encode(text)
    ))).map(b => b.toString(16).padStart(2,'0')).join('');

async function lic_crear() {
    const admin_id   = document.getElementById('lic-admin-id')?.value.trim();
    const cliente_id = document.getElementById('lic-cliente-id')?.value.trim();
    const tipo       = document.getElementById('lic-tipo')?.value;
    const dias       = parseInt(document.getElementById('lic-dias')?.value) || 365;
    const notas      = document.getElementById('lic-notas')?.value.trim();

    if (!admin_id)   { _toast('Selecciona un administrador.','warning'); return; }
    if (!cliente_id) {
        _toast('Ingresa el ID Cliente del dispositivo del administrador.','warning');
        document.getElementById('lic-cliente-id')?.focus();
        return;
    }

    const wrap = document.getElementById('lic-resultado-wrap');
    if (wrap) wrap.style.display = 'none';

    try {
        // Calcular clave de activación (misma fórmula que lic_activateLicense)
        const secretKey = (typeof getSecretKey === 'function')
            ? getSecretKey() : 'MySuperSecretKeyForTPVApp2024';
        const claveActivacion = tipo === 'ilimitada'
            ? await _lic_sha256('admin' + secretKey)
            : await _lic_sha256(cliente_id + secretKey + dias + 'dias');

        // Guardar en BD con la clave
        const res = await fetch('/api/licencias/crear', {
            method:'POST', headers:{'Content-Type':'application/json'},
            credentials:'same-origin',
            body: JSON.stringify({ admin_id, tipo, dias, notas,
                                   cliente_id, clave_activacion: claveActivacion })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) { _toast(data.mensaje||'Error al crear','danger'); return; }

        // Mostrar clave generada
        const claveEl = document.getElementById('lic-clave-generada');
        if (claveEl) claveEl.value = claveActivacion;
        if (wrap)    wrap.style.display = '';

        _lic_cargarLista();
        _toast(`✅ Licencia ${tipo} generada para ${data.admin_nombre}`, 'success');

    } catch(e) { _toast('Error: ' + e.message, 'danger'); }
}

function lic_copiarClave() {
    const el = document.getElementById('lic-clave-generada');
    if (!el?.value) return;
    navigator.clipboard?.writeText(el.value)
        .then(() => _toast('✅ Clave copiada al portapapeles', 'success'))
        .catch(() => { el.select(); document.execCommand('copy'); _toast('✅ Clave copiada','success'); });
}

async function lic_revocar(licencia_id, nombre) {
    if (!confirm(`¿Revocar licencia de "${nombre}"?`)) return;
    try {
        const res = await fetch(`/api/licencias/${licencia_id}`, { method:'DELETE', credentials:'same-origin' });
        if (res.ok) { _toast('Licencia revocada','success'); _lic_cargarLista(); }
        else _toast((await res.json()).mensaje||'Error','danger');
    } catch(e) {}
}

// ══════════════════════════════════════════════════════════════
//  ENTRADA DE STOCK AL ALMACÉN GENERAL
// ══════════════════════════════════════════════════════════════

function _admin_abrirEntrada() {
    // Crear modal de entrada si no existe
    let modal = document.getElementById('modal-entrada-stock');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-entrada-stock';
        modal.className = 'modal fade';
        modal.setAttribute('tabindex', '-1');
        modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header text-white fw-bold"
                 style="background:linear-gradient(135deg,#059669,#047857)">
              <span><i class="bi bi-plus-circle-fill me-2"></i>Añadir Stock al Almacén</span>
              <button class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label fw-bold">Producto *</label>
                <select id="ent-producto" class="form-select">
                  <option value="">-- Seleccionar producto --</option>
                </select>
                <small class="text-muted">Productos del catálogo del TPV</small>
              </div>
              <div class="row g-3">
                <div class="col-6">
                  <label class="form-label fw-bold">Cantidad *</label>
                  <input type="number" id="ent-cantidad" class="form-control"
                         min="0.01" step="0.01" placeholder="0">
                </div>
                <div class="col-6">
                  <label class="form-label fw-bold">Precio de Compra</label>
                  <input type="number" id="ent-precio-compra" class="form-control"
                         min="0" step="0.01" placeholder="0.00">
                </div>
                <div class="col-12">
                  <label class="form-label fw-bold">Proveedor</label>
                  <input type="text" id="ent-proveedor" class="form-control"
                         placeholder="Nombre del proveedor (opcional)">
                </div>
                <div class="col-12">
                  <label class="form-label fw-bold">Nota</label>
                  <input type="text" id="ent-nota" class="form-control"
                         placeholder="Observaciones (opcional)">
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button class="btn btn-success fw-bold" onclick="_admin_registrarEntrada()">
                <i class="bi bi-check-circle-fill me-2"></i>Registrar Entrada
              </button>
            </div>
          </div>
        </div>`;
        document.body.appendChild(modal);
    }

    // Poblar selector de productos desde el catálogo del TPV
    const sel = document.getElementById('ent-producto');
    if (sel) {
        const prods = (typeof tpvState !== 'undefined' && tpvState.productos) || [];
        sel.innerHTML = '<option value="">-- Seleccionar producto --</option>' +
            [...prods].sort((a,b) => a.nombre.localeCompare(b.nombre))
                .map(p => `<option value="${p.id}"
                    data-nombre="${p.nombre.replace(/"/g,'&quot;')}"
                    data-precio="${p.precio||0}"
                    data-costo="${p.costoUnitario||0}">
                    ${p.nombre} — $${parseFloat(p.precio||0).toFixed(2)}
                  </option>`).join('');
        sel.onchange = () => {
            const opt = sel.options[sel.selectedIndex];
            if (opt && opt.value) {
                const costo = opt.dataset.costo || 0;
                const pcEl  = document.getElementById('ent-precio-compra');
                if (pcEl && !pcEl.value) pcEl.value = parseFloat(costo).toFixed(2);
            }
        };
    }

    // Limpiar campos
    ['ent-cantidad','ent-precio-compra','ent-proveedor','ent-nota'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    new bootstrap.Modal(modal).show();
}

async function _admin_registrarEntrada() {
    const sel       = document.getElementById('ent-producto');
    const opt       = sel?.options[sel.selectedIndex];
    const prodId    = sel?.value?.trim();
    const nombre    = opt?.dataset?.nombre || '';
    const cantidad  = parseFloat(document.getElementById('ent-cantidad')?.value) || 0;
    const pCompra   = parseFloat(document.getElementById('ent-precio-compra')?.value) || 0;
    const proveedor = document.getElementById('ent-proveedor')?.value?.trim() || '';
    const nota      = document.getElementById('ent-nota')?.value?.trim() || '';

    if (!prodId)     { _toast('Selecciona un producto.', 'warning'); return; }
    if (cantidad<=0) { _toast('La cantidad debe ser mayor a 0.', 'warning'); return; }

    try {
        // Get extra product info from tpvState catalog
        const prodCat = (typeof tpvState !== 'undefined' && tpvState.productos || [])
            .find(p => p.id === prodId);
        const precioVenta  = prodCat?.precio        || 0;
        const categoria    = prodCat?.categoria      || 'General';
        const unidadMedida = prodCat?.unidadMedida   || 'Un';

        const res  = await fetch('/api/inventario/entrada', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ producto_id: prodId, nombre, cantidad,
                                   precio_compra: pCompra, precio_venta: precioVenta,
                                   categoria, unidad_medida: unidadMedida,
                                   proveedor, nota })
        });
        const data = await res.json();
        if (res.ok && data.ok) {
            _toast(`✅ ${data.mensaje}`, 'success');
            // Cerrar modal
            const modalEl = document.getElementById('modal-entrada-stock');
            if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();
            // Recargar almacén
            _admin_cargarVendedores();
        } else {
            _toast(data.mensaje || 'Error al registrar entrada', 'danger');
        }
    } catch(e) {
        _toast('Error de conexión: ' + e.message, 'danger');
    }
}

// ══════════════════════════════════════════════════════════════
//  VISTA PREVIA DE IMAGEN EN MODAL PRODUCTO
// ══════════════════════════════════════════════════════════════
function gestion_previewImagen(input) {
    const file = input?.files?.[0];
    const wrap = document.getElementById('gestion-img-preview-wrap');
    const img  = document.getElementById('gestion-img-preview');
    if (!file || !wrap || !img) return;
    const reader = new FileReader();
    reader.onload = e => {
        img.src = e.target.result;
        wrap.classList.remove('d-none');
        // Limpiar URL si se elige archivo local
        const urlInput = document.getElementById('gestion-producto-imagen-url');
        if (urlInput) urlInput.value = '';
    };
    reader.readAsDataURL(file);
}

function gestion_limpiarImagen() {
    const wrap  = document.getElementById('gestion-img-preview-wrap');
    const img   = document.getElementById('gestion-img-preview');
    const file  = document.getElementById('gestion-producto-imagen-local');
    if (wrap) wrap.classList.add('d-none');
    if (img)  img.src = '';
    if (file) file.value = '';
}

// Cuando se carga un producto a editar con imagen existente, mostrar preview
function gestion_mostrarPreviewExistente(urlImagen) {
    if (!urlImagen) return;
    const wrap = document.getElementById('gestion-img-preview-wrap');
    const img  = document.getElementById('gestion-img-preview');
    if (wrap && img) {
        img.src = urlImagen;
        wrap.classList.remove('d-none');
    }
}


// ══════════════════════════════════════════════════════════════
//  IMPORTAR CATÁLOGO → ALMACÉN GENERAL
// ══════════════════════════════════════════════════════════════
async function _admin_importarCatalogo() {
    const total = typeof tpvState !== 'undefined' ? (tpvState?.productos?.length||0) : 0;
    if (total === 0) {
        _toast('El catálogo está vacío. Añade productos en Gestión de Productos primero.','warning');
        return;
    }
    if (!confirm(
        `¿Importar ${total} producto(s) del catálogo al Almacén General?\n\n` +
        `• Productos NUEVOS → se crean con stock 0\n` +
        `• Productos EXISTENTES → actualiza nombre/precio, conserva stock`
    )) return;
    const btn = document.getElementById('btn-imp-cat') ||
                document.querySelector('button[onclick="_admin_importarCatalogo()"]');
    const ori = btn?.innerHTML;
    if (btn) { btn.disabled=true; btn.innerHTML='<span class="spinner-border spinner-border-sm me-1"></span>Importando...'; }
    try {
        const res  = await fetch('/api/inventario/importar-catalogo',{
            method:'POST',credentials:'same-origin',
            headers:{'Content-Type':'application/json'}
        });
        const data = await res.json();
        if (data.ok) {
            _toast(`✅ ${data.nuevos} nuevos · ${data.existentes} actualizados`,'success');
            _admin_cargarAlmacen();
        } else {
            _toast('❌ '+(data.mensaje||'Error'),'danger');
        }
    } catch(e) { _toast('❌ '+e.message,'danger'); }
    finally { if(btn){btn.disabled=false;btn.innerHTML=ori;} }
}

// ══════════════════════════════════════════════════════════════
//  SYNC ALMACÉN → CATÁLOGO (Gestión de Productos)
// ══════════════════════════════════════════════════════════════
async function _admin_sincronizarAlCatalogo() {
    const btn = document.querySelector('button[onclick="_admin_sincronizarAlCatalogo()"]');
    const ori = btn?.innerHTML;
    if (btn) { btn.disabled=true; btn.innerHTML='<span class="spinner-border spinner-border-sm me-1"></span>Sync...'; }
    try {
        const res  = await fetch('/api/catalogo/sync-desde-inventario',{
            method:'POST',credentials:'same-origin',
            headers:{'Content-Type':'application/json'}
        });
        const data = await res.json();
        if (data.ok && data.total > 0) {
            if (typeof tpvState !== 'undefined') {
                const lm = {};
                (tpvState.productos||[]).forEach(p => { lm[p.id]=p; });
                tpvState.productos = data.productos.map(sp => ({...(lm[sp.id]||{}),...sp}));
                const cats = [...new Set(tpvState.productos.map(p=>p.categoria||'General'))].filter(Boolean).sort();
                if (cats.length) tpvState.categorias = cats;
            }
            _toast(`✅ ${data.total} productos sincronizados al catálogo`,'success');
            if (typeof gestion_renderizarTablaProductos  === 'function') gestion_renderizarTablaProductos();
            if (typeof gestion_renderizarFiltrosProductos === 'function') gestion_renderizarFiltrosProductos();
            if (typeof gestion_renderizarListaCategorias  === 'function') gestion_renderizarListaCategorias();
            if (typeof tpv_renderizarProductos            === 'function') tpv_renderizarProductos();
            if (typeof tpv_renderizarFiltroCategorias     === 'function') tpv_renderizarFiltroCategorias();
        } else if (data.ok && data.total === 0) {
            _toast('El almacén está vacío. Añade stock primero.','warning');
        } else {
            _toast('❌ '+(data.mensaje||'Error'),'danger');
        }
    } catch(e) { _toast('❌ '+e.message,'danger'); }
    finally { if(btn){btn.disabled=false;btn.innerHTML=ori;} }
}
