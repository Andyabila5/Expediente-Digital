create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists pacientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  cedula text not null default '',
  fecha_nacimiento date,
  telefono text not null default '',
  correo text not null default '',
  datos_demograficos text not null default '',
  ahf text not null default '',
  app text not null default '',
  apnp text not null default '',
  aqxt text not null default '',
  mc text not null default '',
  pa text not null default '',
  aua text not null default '',
  hematuria text not null default '',
  rao text not null default '',
  disuria text not null default '',
  ef_tr text not null default '',
  ef_testis text not null default '',
  ef_pene text not null default '',
  lab_psa text not null default '',
  lab_ego text not null default '',
  lab_pfr text not null default '',
  plan text not null default '',
  fecha_registro timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists resultados_pruebas (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references pacientes(id) on delete cascade,
  nombre_prueba text not null,
  fecha date not null default current_date,
  resultado text not null default '',
  notas text not null default '',
  attachment_name text,
  attachment_mime_type text,
  attachment_size integer,
  attachment_data bytea,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists resultados_laboratorio (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references pacientes(id) on delete cascade,
  nombre_analisis text not null,
  fecha date not null default current_date,
  valores text not null default '',
  notas text not null default '',
  attachment_name text,
  attachment_mime_type text,
  attachment_size integer,
  attachment_data bytea,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists citas (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references pacientes(id) on delete cascade,
  fecha_hora timestamptz not null,
  motivo text not null,
  notas text not null default '',
  estado text not null default 'programada' check (estado in ('programada', 'confirmada', 'completada', 'cancelada')),
  recordatorio_whatsapp boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_resultados_pruebas_paciente on resultados_pruebas(paciente_id);
create index if not exists idx_resultados_laboratorio_paciente on resultados_laboratorio(paciente_id);
create index if not exists idx_citas_paciente on citas(paciente_id);
create index if not exists idx_citas_fecha_hora on citas(fecha_hora);

drop trigger if exists pacientes_set_updated_at on pacientes;
create trigger pacientes_set_updated_at
before update on pacientes
for each row
execute function set_updated_at();

drop trigger if exists resultados_pruebas_set_updated_at on resultados_pruebas;
create trigger resultados_pruebas_set_updated_at
before update on resultados_pruebas
for each row
execute function set_updated_at();

drop trigger if exists resultados_laboratorio_set_updated_at on resultados_laboratorio;
create trigger resultados_laboratorio_set_updated_at
before update on resultados_laboratorio
for each row
execute function set_updated_at();

drop trigger if exists citas_set_updated_at on citas;
create trigger citas_set_updated_at
before update on citas
for each row
execute function set_updated_at();

-- ─── Auth: users & audit log ───────────────────────────────────────────────

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists users_set_updated_at on users;
create trigger users_set_updated_at
before update on users
for each row
execute function set_updated_at();

-- Seed: run this once after creating the table.
-- Replace the hash below with the output of:
--   node -e "const b=require('bcryptjs'); b.hash('YOUR_PASSWORD',12).then(console.log)"
-- insert into users (username, password_hash) values ('admin', '$2a$12$REPLACE_THIS_HASH');

create table if not exists audit_log (
  id bigserial primary key,
  username text not null,
  action text not null,           -- e.g. 'login', 'logout', 'create_paciente', 'delete_paciente'
  entity_type text,               -- e.g. 'paciente', 'cita', 'resultado_prueba'
  entity_id text,                 -- UUID of the affected record, if any
  ip_address text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_audit_log_username on audit_log(username);
create index if not exists idx_audit_log_created_at on audit_log(created_at desc);

-- ─── Google OAuth tokens (persiste en BD para sobrevivir deploys) ───────────

create table if not exists app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists app_settings_set_updated_at on app_settings;
create trigger app_settings_set_updated_at
before update on app_settings
for each row
execute function set_updated_at();
