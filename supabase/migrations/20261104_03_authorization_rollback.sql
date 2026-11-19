-- ============================================================================
-- Nova OBS · P0 / 03 · Geri alma
-- ----------------------------------------------------------------------------
-- !!! DİKKAT: BU DOSYA FONKSİYON YETKİLERİNİ GEVŞETİR. !!!
--
-- Yeniden açılan davranışlar:
--   * handle_new_user(), current_profile_role() ve
--     is_conversation_participant() PUBLIC tarafından çağrılabilir.
--   * Bu, anon dahil her rolün bu fonksiyonları doğrudan çalıştırmasına
--     izin verir; trigger/cron fonksiyonları için gereksiz ve geniş bir
--     yüzeydir.
--   * purge_expired_messages() 03'te kapalıydı; bu geri alma onu yeniden
--     PUBLIC'e açmaz (yalnızca yukarıdaki üç fonksiyon).
--
-- SIRA: Geri alma zincirinin İLK adımıdır. Ardından 02, en son 01 geri
-- alınmalıdır. 01 silinmeden bu dosyayı çalıştırmak güvenlik açığını
-- gereksiz süre açık tutar.
-- ============================================================================

begin;

grant execute on function public.handle_new_user() to public;
grant execute on function public.current_profile_role() to public;
grant execute on function public.is_conversation_participant(uuid) to public;

-- Yoklama RPC'leri 01'de zaten yalnızca authenticated rolüne açılmıştı.
-- Bu geri alma onları anon/public'e açmaz.
grant execute on function public.attendance_start_session(text, integer)
  to authenticated;
grant execute on function public.attendance_current_code(uuid)
  to authenticated;
grant execute on function public.attendance_end_session(uuid)
  to authenticated;
grant execute on function public.attendance_lookup_code(text)
  to authenticated;
grant execute on function public.attendance_join_session(uuid, text, text)
  to authenticated;

-- 03'ün tablo yazma yasakları, dizin erişim kısıtları ve yoklama iç
-- yardımcılarının kapalılığı BİLİNÇLİ OLARAK geri alınmaz. Bunlar 01/02'nin
-- güvenlik modelinin parçasıdır; geri açılmaları doğrudan veri bütünlüğü
-- riski yaratır. Bu dosya yalnızca fonksiyon EXECUTE gevşemesini geri alır.

commit;
