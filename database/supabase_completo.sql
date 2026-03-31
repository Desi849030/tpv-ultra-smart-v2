-- TPV ULTRA SMART v6.0 - Esquema Supabase COMPLETO
-- Ejecutar en: Supabase Dashboard -> SQL Editor

-- PASO 1: Eliminar indices sueltos que puedan quedar
DROP INDEX IF EXISTS idx_tpv_usuarios_rol;
DROP INDEX IF EXISTS idx_tpv_clientes_email;
DROP INDEX IF EXISTS idx_tpv_productos_cat;
DROP INDEX IF EXISTS idx_tpv_productos_activo;
DROP INDEX IF EXISTS idx_tpv_ventas_fecha;
DROP INDEX IF EXISTS idx_tpv_ventas_vendedor;
DROP INDEX IF EXISTS idx_tpv_ventas_producto;
DROP INDEX IF EXISTS idx_tpv_stock_cat;
DROP INDEX IF EXISTS idx_tpv_gastos_fecha;
DROP INDEX IF EXISTS idx_tpv_hist_fecha;

-- PASO 2: Eliminar tablas existentes
DROP TABLE IF EXISTS tpv_historial_diario CASCADE;
DROP TABLE IF EXISTS tpv_gastos_dia       CASCADE;
DROP TABLE IF EXISTS tpv_stock            CASCADE;
DROP TABLE IF EXISTS tpv_ventas_dia       CASCADE;
DROP TABLE IF EXISTS tpv_productos        CASCADE;
DROP TABLE IF EXISTS tpv_clientes         CASCADE;
DROP TABLE IF EXISTS tpv_usuarios         CASCADE;
DROP TABLE IF EXISTS tpv_estado           CASCADE;

-- PASO 3: Crear tablas

-- 1. Estado JSON completo del TPV
CREATE TABLE tpv_estado (
    id          SERIAL       PRIMARY KEY,
    dispositivo TEXT         NOT NULL DEFAULT 'principal',
    estado      JSONB        NOT NULL DEFAULT '{}',
    actualizado TIMESTAMPTZ  DEFAULT NOW()
);
INSERT INTO tpv_estado (dispositivo, estado) VALUES ('principal', '{}');

-- 2. Usuarios del staff
CREATE TABLE tpv_usuarios (
    usuario_id    TEXT        PRIMARY KEY,
    username      TEXT        NOT NULL UNIQUE,
    nombre        TEXT        NOT NULL,
    rol           TEXT        NOT NULL,
    password_hash TEXT        NOT NULL,
    password_salt TEXT        NOT NULL,
    activo        BOOLEAN     DEFAULT TRUE,
    ultimo_acceso TIMESTAMPTZ,
    creado        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tpv_usuarios_rol ON tpv_usuarios(rol);

-- 3. Clientes de la tienda online
CREATE TABLE tpv_clientes (
    cliente_id    TEXT        PRIMARY KEY,
    nombre        TEXT        NOT NULL,
    email         TEXT        NOT NULL UNIQUE,
    telefono      TEXT        DEFAULT '',
    password_hash TEXT        NOT NULL,
    password_salt TEXT        NOT NULL,
    activo        BOOLEAN     DEFAULT TRUE,
    creado        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tpv_clientes_email ON tpv_clientes(email);

-- 4. Catalogo de productos
CREATE TABLE tpv_productos (
    producto_id   TEXT        PRIMARY KEY,
    nombre        TEXT        NOT NULL,
    precio        NUMERIC     DEFAULT 0,
    costo         NUMERIC     DEFAULT 0,
    categoria     TEXT        DEFAULT 'General',
    unidad_medida TEXT        DEFAULT 'C/U',
    en_oferta     BOOLEAN     DEFAULT FALSE,
    activo        BOOLEAN     DEFAULT TRUE,
    actualizado   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tpv_productos_cat    ON tpv_productos(categoria, activo);
CREATE INDEX idx_tpv_productos_activo ON tpv_productos(activo);

-- 5. Ventas del dia
CREATE TABLE tpv_ventas_dia (
    venta_id        TEXT        PRIMARY KEY,
    producto_id     TEXT,
    nombre          TEXT,
    cantidad        NUMERIC     DEFAULT 0,
    precio_unit     NUMERIC     DEFAULT 0,
    total           NUMERIC     DEFAULT 0,
    metodo_pago     TEXT        DEFAULT 'efectivo',
    vendedor_id     TEXT,
    vendedor_nombre TEXT,
    fecha           TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tpv_ventas_fecha    ON tpv_ventas_dia(fecha);
CREATE INDEX idx_tpv_ventas_vendedor ON tpv_ventas_dia(vendedor_id);
CREATE INDEX idx_tpv_ventas_producto ON tpv_ventas_dia(producto_id);

-- 6. Stock del almacen
CREATE TABLE tpv_stock (
    producto_id   TEXT        PRIMARY KEY,
    nombre        TEXT,
    stock_actual  NUMERIC     DEFAULT 0,
    precio_venta  NUMERIC     DEFAULT 0,
    categoria     TEXT        DEFAULT 'General',
    actualizado   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tpv_stock_cat ON tpv_stock(categoria);

-- 7. Gastos del dia
CREATE TABLE tpv_gastos_dia (
    id          SERIAL      PRIMARY KEY,
    descripcion TEXT        NOT NULL,
    monto       NUMERIC     NOT NULL DEFAULT 0,
    categoria   TEXT        DEFAULT 'General',
    fecha       TIMESTAMPTZ DEFAULT NOW(),
    admin_id    TEXT
);
CREATE INDEX idx_tpv_gastos_fecha ON tpv_gastos_dia(fecha);

-- 8. Historial diario
CREATE TABLE tpv_historial_diario (
    id                SERIAL      PRIMARY KEY,
    fecha             DATE        NOT NULL UNIQUE,
    total_ventas      NUMERIC     DEFAULT 0,
    num_transacciones INTEGER     DEFAULT 0,
    productos_activos INTEGER     DEFAULT 0,
    inventario_items  INTEGER     DEFAULT 0,
    ventas_data       JSONB       DEFAULT '[]',
    inventario_data   JSONB       DEFAULT '[]',
    config_snapshot   JSONB       DEFAULT '{}',
    ts_guardado       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tpv_hist_fecha ON tpv_historial_diario(fecha DESC);

-- PASO 4: Activar Row Level Security
ALTER TABLE tpv_estado           ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpv_usuarios         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpv_clientes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpv_productos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpv_ventas_dia       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpv_stock            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpv_gastos_dia       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpv_historial_diario ENABLE ROW LEVEL SECURITY;

-- PASO 5: Politicas de acceso
CREATE POLICY "tpv_estado_all"    ON tpv_estado           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "tpv_usuarios_all"  ON tpv_usuarios         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "tpv_clientes_all"  ON tpv_clientes         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "tpv_productos_all" ON tpv_productos        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "tpv_ventas_all"    ON tpv_ventas_dia       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "tpv_stock_all"     ON tpv_stock            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "tpv_gastos_all"    ON tpv_gastos_dia       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "tpv_historial_all" ON tpv_historial_diario FOR ALL USING (true) WITH CHECK (true);

-- PASO 6: Verificacion - debe devolver 8 filas con estado OK
SELECT tablename AS tabla, 'OK' AS estado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'tpv_%'
ORDER BY tablename;
