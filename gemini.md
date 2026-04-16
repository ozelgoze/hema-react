# PROJE ANAYASASI: HEMA-AI (Dueling Analysis Tool)

## 1. TECH STACK & ORTAM
- **Deployment:** Vercel (Serverless/Edge functions uyumlu kod yazılmalı).
- **Frontend:** [Kullandığın Framework'ü buraya yaz, örn: Next.js / React]
- **Internationalization (i18n):** 4 Dil Destekli (EN, TR, DE, IT).
- **UI Teması:** Industrial / Grimdark / Tarihsel El Yazması (Manuscript) estetiği.

## 2. KESİN VE DEĞİŞMEZ KURALLAR (STRICT RULES)
1. **SIFIR HARDCODED METİN:** UI bileşenleri içine asla doğrudan metin yazma. Tüm metinler `t('key')` şeklinde i18n dosyalarından çekilecek. Yeni bir metin eklediğinde mutlaka 4 dildeki karşılığını (EN, TR, DE, IT) bana bildir.
2. **KONUMSAL KESİNLİK (SPATIAL AWARENESS):** Yeni bir UI elemanı (buton, ikon vb.) eklerken konumunu "rastgele" belirleme. DOM hiyerarşisinde nerede duracağını ve CSS (Flex/Grid/Absolute) kurallarını net bir şekilde belirt.
3. **MOBİL ÖNCELİKLİ (MOBILE-FIRST):** Tasarımlar her zaman mobil ekrana uygun olmalı. Tıklanabilir alanlar (touch targets) en az 44x44px olmalı, öğeler birbirine girmemeli.
4. **TEKNİK DİL:** HEMA terimleri (Zornhau, Vor, Nach vb.) teknik terimdir; bunları tercüme etme, teknik bağlamda (Almanca/İtalyanca orijinalleriyle) koru.

## 3. UI/UX STANDARTLARI
- **Language Switcher (Dil Butonu):** Asla ekranın ortasında veya rastgele bir div içinde serbest bırakılmayacak. Ya Header'ın sağ üst köşesinde ya da 'Duel Control' panelinin sağ üst köşesinde, mevcut ikonlarla dikey olarak hizalı (`align-items: center`) duracak.
- **Tree Visualization:** Node'lar genişleyip daraldığında (Expand/Collapse) bağlantı çizgileri (edges) kırılmamalı.
- **Renk Paleti:** Tarihsel dokuya uygun; parşömen tonları, koyu gri/siyah kontrastı ve aksiyonlar için belirgin kırmızı vurgular kullanılacak.

## 4. AKTİF YOL HARİTASI (TODO)
- [ ] **Searchable Dropdown:** 'Other Options' menüsüne arama özelliği ekle.
- [ ] **AI Recommendation:** Önerilen hamleyi checkbox ile değil, direkt tıklanabilir bir 'AI Suggestion' kartı olarak göster.
- [ ] **Node Cleanup:** Ağaçtaki kartların detaylarını default olarak gizle, 'More' ikonu ile açılır yap.
- [ ] **Language Sync:** Dil butonu yerleşimini ve z-index değerini sabitle.

## 5. İLETİŞİM PROTOKOLÜ
- Gereksiz nezaket cümleleri ve "Harika bir fikir!" gibi övgüler istemiyorum.
- Hata bulduğunda net söyle, çözüm odaklı ol.
- Sadece değişen kod bloklarını ver, tüm dosyayı tekrar basarak context'i şişirme.