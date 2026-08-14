-- ===========================================================
-- War Room — Supabase Schema
-- Run this SQL in your Supabase SQL Editor to create tables
-- ===========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main state table (single row, always updated)
CREATE TABLE war_room_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  defcon_value INTEGER NOT NULL DEFAULT 52,
  status_vars JSONB NOT NULL DEFAULT '[]'::jsonb,
  breaking_news JSONB NOT NULL DEFAULT '[]'::jsonb,
  zones JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Version history / logs table
CREATE TABLE war_room_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version_number SERIAL,
  changes_summary TEXT NOT NULL DEFAULT '',
  snapshot_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Realtime on war_room_state
ALTER PUBLICATION supabase_realtime ADD TABLE war_room_state;

-- Insert initial default state row
INSERT INTO war_room_state (defcon_value, status_vars, breaking_news, zones)
VALUES (
  52,
  '[
    {"id":"estabilidad","label":"ESTABILIDAD ECON. PMR","description":"Salud financiera de Transnistria. Si baja de 20 → protestas civiles, moral -30%","value":38,"max":100},
    {"id":"cobasna","label":"RIESGO COBASNA","description":"Probabilidad de detonación del arsenal de 20.000 toneladas","value":22,"max":100},
    {"id":"opinion","label":"OPINIÓN PÚBLICA INTL.","description":"0 = Pro-OTSC  ←→  100 = Pro-OTAN. Determina legitimidad de intervención","value":62,"max":100},
    {"id":"flujo","label":"FLUJO ENERGÉTICO","description":"Suministro gas Gazprom. <50 = resta -5 pts/turno a ESTABILIDAD","value":48,"max":100}
  ]'::jsonb,
  '[
    {"id":"news-1","headline":"TROPAS DESPLEGADAS EN LA FRONTERA","country":"Polonia","countryId":"616","coordinates":[19.1451,51.9194],"side":"nato"},
    {"id":"news-2","headline":"MOVIMIENTO DE FLOTA EN EL MAR NEGRO","country":"Rusia","countryId":"643","coordinates":[37.6173,55.7558],"side":"csto"}
  ]'::jsonb,
  '[
    {"id":"zone-1","name":"Chisináu (Orilla Occidental)","natoControl":100,"natoText":"Moldavia / Pro-OTAN (100%)","cstoControl":0,"cstoText":"Moldavia / Pro-OTAN (100%)","coordinates":[28.8575,47.0056]},
    {"id":"zone-2","name":"Tiráspol (Orilla Oriental)","natoControl":0,"natoText":"Transnistria / OTSC (100%)","cstoControl":100,"cstoText":"Transnistria / OTSC (100%)","coordinates":[29.6265,46.8364]},
    {"id":"zone-3","name":"Puente de Dubasari","natoControl":50,"natoText":"Disputado (JCC - 50/50)","cstoControl":50,"cstoText":"Disputado (JCC - 50/50)","coordinates":[29.1578,47.2683]},
    {"id":"zone-4","name":"Zona de Seguridad (Tighina/Bender)","natoControl":50,"natoText":"Disputado (JCC - 50/50)","cstoControl":50,"cstoText":"Disputado (JCC - 50/50)","coordinates":[29.4754,46.8242]},
    {"id":"zone-5","name":"Depósito de Cobasna","natoControl":0,"natoText":"OTSC (90%) / Riesgo (10%)","cstoControl":90,"cstoText":"OTSC (90%) / Riesgo (10%)","coordinates":[29.1994,47.7651]}
  ]'::jsonb
);

-- Row-Level Security (optional, open for now)
ALTER TABLE war_room_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE war_room_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read/write (for development; restrict in production)
CREATE POLICY "Allow all on war_room_state" ON war_room_state FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on war_room_logs" ON war_room_logs FOR ALL USING (true) WITH CHECK (true);
