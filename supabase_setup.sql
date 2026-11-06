-- ==============================================================================
-- SQL สำหรับแก้ไขปัญหา event_code (UUID Error) ใน Supabase
-- วิธีใช้: นำโค้ดนี้ไปวางและกด Run ใน Supabase Console -> SQL Editor
-- ==============================================================================

-- 1. เปลี่ยนประเภท event_code ให้เป็น TEXT เพื่อไม่ให้ฟ้อง ERROR: invalid input syntax for type uuid
ALTER TABLE public.events ALTER COLUMN event_code TYPE TEXT USING event_code::text;

-- 2. ปรับปรุงประเภทคอลัมน์ date ให้เป็น TEXT
ALTER TABLE public.events ALTER COLUMN date TYPE TEXT;

-- 3. ตรวจสอบคอลัมน์ที่จำเป็น
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS place TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '🐥';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS members INTEGER DEFAULT 1;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS code TEXT;

-- 4. ซิงค์ค่าระหว่าง code และ event_code ให้ตรงกันทั้งหมด
UPDATE public.events SET event_code = code WHERE event_code IS NULL AND code IS NOT NULL;
UPDATE public.events SET code = event_code WHERE code IS NULL AND event_code IS NOT NULL;

-- 5. สิทธิ์ RLS สำหรับทุกคน
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read" ON public.events;
CREATE POLICY "Allow public read" ON public.events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert" ON public.events;
CREATE POLICY "Allow public insert" ON public.events FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update" ON public.events;
CREATE POLICY "Allow public update" ON public.events FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete" ON public.events;
CREATE POLICY "Allow public delete" ON public.events FOR DELETE USING (true);
