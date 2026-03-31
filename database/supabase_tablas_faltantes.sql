-- ════════════════════════════════════════════════════════════════════════
--  TPV ULTRA SMART — Tablas Supabase Faltantes
--  Ejecutar en: Supabase Dashboard → SQL Editor
--  Tablas: tpv_ventas_dia, tpv_stock, tpv_gastos_dia, tpv_historial_diario
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. Ventas del día ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tpv_ventas_dia (
    venta_id        TEXT PRIMARY KEY,
    producto_id     TEXT,
    nombre          TEXT,
    cantidad        NUMERIC DEFAULT 0,
    precio_unit     NUMERIC DEFAULT 0,
    total           NUMERIC DEFAULT 0,
    metodo_pago     TEXT    DEFAULT 'efectivo',
    vendedor_id     TEXT,
    vendedor_nombre TEXT,
    fecha           TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tpv_ventas_fecha    ON tpv_ventas_dia(fecha);
CREATE INDEX IF NOT EXISTS idx_tpv_ventas_vendedor ON tpv_ventas_dia(vendedor_id);

-- ── 2. Stock del almacén ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tpv_stock (
    producto_id   TEXT PRIMARY KEY,
    nombre        TEXT,
    stock_actual  NUMERIC DEFAULT 0,
    precio_venta  NUMERIC DEFAULT 0,
    categoria     TEXT    DEFAULT 'General',
    actualizado   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tpv_stock_cat ON tpv_stock(categoria);

-- ── 3. Gastos del día ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tpv_gastos_dia (
    id          SERIAL PRIMARY KEY,
    descripcion TEXT    NOT NULL,
    monto       NUMERIC NOT NULL DEFAULT 0,
    categoria   TEXT    DEFAULT 'General',
    fecha       TIMESTAMPTZ DEFAULT NOW(),
    admin_id    TEXT
);
CREATE INDEX IF NOT EXISTS idx_tpv_gastos_fecha ON tpv_gastos_dia(fecha);

-- ── 4. Historial diario (snapshots automáticos) ──────────────────────────
CREATE TABLE IF NOT EXISTS tpv_historial_diario (
    id                SERIAL PRIMARY KEY,
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
CREATE INDEX IF NOT EXISTS idx_tpv_hist_fecha ON tpv_historial_diario(fecha DESC);

-- ── Row Level Security (RLS) ─────────────────────────────────────────────
ALTER TABLE tpv_ventas_dia       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpv_stock            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpv_gastos_dia       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpv_historial_diario ENABLE ROW LEVEL SECURITY;

-- Políticas: acceso total desde el backend (service_role / anon para escritura)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tpv_ventas_dia'       AND policyname='backend_all_ventas')    THEN CREATE POLICY "backend_all_ventas"    ON tpv_ventas_dia       FOR ALL USING (true) WITH CHECK (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tpv_stock'            AND policyname='backend_all_stock')     THEN CREATE POLICY "backend_all_stock"     ON tpv_stock            FOR ALL USING (true) WITH CHECK (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tpv_gastos_dia'       AND policyname='backend_all_gastos')    THEN CREATE POLICY "backend_all_gastos"    ON tpv_gastos_dia       FOR ALL USING (true) WITH CHECK (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tpv_historial_diario' AND policyname='backend_all_historial') THEN CREATE POLICY "backend_all_historial" ON tpv_historial_diario FOR ALL USING (true) WITH CHECK (true); END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════
--  ✅ Listo. Después de ejecutar esto, pulsa "☁️ Setup" en el Debug TPV
--     para verificar que todas las tablas aparecen con ✅
-- ════════════════════════════════════════════════════════════════════════
