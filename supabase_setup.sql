-- ==============================================================================
-- SQL สำหรับตั้งค่าและอัปเดตระบบ Event, Google Calendar & Places ใน Supabase
-- วิธีใช้: นำโค้ดนี้ไปวางและกด Run ใน Supabase Console -> SQL Editor
-- ==============================================================================

-- 1. ปรับปรุงประเภท event_code และ date ให้เป็น TEXT
ALTER TABLE public.events ALTER COLUMN event_code TYPE TEXT USING event_code::text;
ALTER TABLE public.events ALTER COLUMN date TYPE TEXT;

-- 2. ตรวจสอบคอลัมน์พื้นฐาน
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS place TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '🐥';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS members INTEGER DEFAULT 1;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'voting';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. คอลัมน์สำหรับระบบเลือก Range วัน, Deadline, สรุปวัน และ สถานที่ 1-5 (Google Maps & Calendar)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS start_date TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS end_date TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS deadline TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS final_date TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS places JSONB;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS member_votes JSONB;

-- 4. ซิงค์ค่าระหว่าง code และ event_code ให้ตรงกันทั้งหมด
UPDATE public.events SET event_code = code WHERE event_code IS NULL AND code IS NOT NULL;
UPDATE public.events SET code = event_code WHERE code IS NULL AND event_code IS NOT NULL;

-- 5. สิทธิ์ RLS (Row Level Security) สำหรับทุกคนให้อ่าน เขียน อัปเดต และลบได้
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read" ON public.events;
CREATE POLICY "Allow public read" ON public.events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert" ON public.events;
CREATE POLICY "Allow public insert" ON public.events FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update" ON public.events;
CREATE POLICY "Allow public update" ON public.events FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete" ON public.events;
CREATE POLICY "Allow public delete" ON public.events FOR DELETE USING (true);
