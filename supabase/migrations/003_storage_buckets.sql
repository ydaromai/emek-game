-- Create storage buckets for animal media
INSERT INTO storage.buckets (id, name, public) VALUES ('animal-images', 'animal-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('animal-videos', 'animal-videos', true);

-- Storage policies: anyone can read, admins can write
CREATE POLICY "Public read access for animal images" ON storage.objects
  FOR SELECT USING (bucket_id = 'animal-images');

CREATE POLICY "Admin write access for animal images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'animal-images' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin delete access for animal images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'animal-images' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Public read access for animal videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'animal-videos');

CREATE POLICY "Admin write access for animal videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'animal-videos' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin delete access for animal videos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'animal-videos' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
