/**
 * Subtitle Generator for AI Video Tutor.
 * Auto-generates WebVTT subtitles in 109 languages for the React demo application.
 * Run this script using Node.js: node generate_subtitles.js
 */

const fs = require('fs');
const path = require('path');

// Target file destination
const TARGET_PATH = path.join(__dirname, '../../examples/react-demo/src/subtitles.js');

// 109 languages translation dictionary for the 3 English cues
const translations = {
  af: [
    "Welkom by die pasgemaakte AI Video Tutor-werkspasie.",
    "Hierdie speler loop heeltemal op 'n doekskerm sonder enige video-etikette.",
    "Jy kan die terugspeeltempo aanpas, onderskrifte kies of klankvertalings wissel."
  ],
  sq: [
    "Mirë se vini në hapësirën e personalizuar të punës të AI Video Tutor.",
    "Ky luajtës funksionon plotësisht në një ekran kanavacë pa asnjë etiketë videoje.",
    "Mund të rregulloni shpejtësinë e luajtjes, të zgjidhni titrat ose të ndryshoni përkthimet audio."
  ],
  am: [
    "ወደ ብጁ የ-AI ቪዲዮ መማሪያ የስራ ቦታ እንኳን በደህና መጡ።",
    "ይህ ማጫወቻ ያለምንም የቪዲዮ መለያዎች ሙሉ በሙሉ በሸራ ማያ ገጽ ላይ ይሰራል።",
    "የማጫወቻ ፍጥነትን ማስተካከል፣ የትርጉም ጽሑፎችን መምረጥ ወይም የድምጽ ትርጉሞችን መቀየር ይችላሉ።"
  ],
  ar: [
    "مرحبًا بك في مساحة عمل معلم الفيديو المخصص بالذكاء الاصطناعي.",
    "يعمل هذا المشغل تمامًا على شاشة قماشية بدون أي علامات فيديو.",
    "يمكنك ضبط معدل التشغيل، أو اختيار الترجمة المصاحبة، أو تبديل الترجمات الصوتية."
  ],
  hy: [
    "Բարի գալուստ AI Video Tutor-ի անհատականացված աշխատանքային տարածք:",
    "Այս նվագարկիչն ամբողջությامբ աշխատում է կտավի էկրանին՝ առանց որևէ տեսատեգերի:",
    "Դուք կարող եք կարգավորել նվագարկման արագությունը, ընտրել ենթագրերը կամ փոխել աուդիո թարգմանությունները:"
  ],
  as: [
    "কাষ্টম AI ভিডিঅ’ টিউটৰ কৰ্মক্ষেত্ৰলৈ আপোনাক স্বাগতম।",
    "এই প্লেয়াৰটো কোনো ভিডিঅ’ টেগ নোহোৱাকৈ সম্পূৰ্ণৰূপে কেনভাছ স্ক্ৰীণত চলে।",
    "আপুনি প্লেবেকৰ গতি মিলাই ল’ব পাৰে, উপশীৰ্ষক বাছনি কৰিব পাৰে বা অডিঅ’ অনুবাদ সলনি কৰিব পাৰে।"
  ],
  az: [
    "Fərdiləşdirilmiş AI Video Tutor iş sahəsinə xoş gəlmisiniz.",
    "Bu pleyer heç bir video etiketi olmadan tamamilə kətan ekranında işləyir.",
    "Oxutma sürətini tənzimləyə, altyazıları seçə və ya audio tərcümələri dəyişə bilərsiniz."
  ],
  eu: [
    "Ongi etorri AI Video Tutor lan-eremu pertsonalizatura.",
    "Erreproduzitzaile honek mihise-pantaila batean funtzionatzen du erabat, bideo-etiketarik gabe.",
    "Erreproduzitzeko abiadura doitu, azpitituluak hautatu edo audio-itzulpenak aldatu ditzakezu."
  ],
  be: [
    "Сардэчна запрашаем у персаналізаваную рабочую прастору AI Video Tutor.",
    "Гэты прайгравальнік працуе цалкам на экране палатна без якіх-небудзь відэатэгаў.",
    "Вы можаце наладзіць хуткасць прайгравання, выбраць субтытры або пераключыць аўдыяпераклады."
  ],
  bn: [
    "কাস্টম এআই ভিডিও টিউটর ওয়ার্কস্পেসে আপনাকে স্বাগতম।",
    "এই প্লেয়ারটি কোনো ভিডিও ট্যাগ ছাড়াই সম্পূর্ণ ক্যানভাস স্ক্রিনে চলে।",
    "আপনি প্লেব্যাকের গতি সমন্বয় করতে পারেন, সাবটাইটেল নির্বাচন করতে পারেন বা অডিও অনুবাদ পরিবর্তন করতে পারেন।"
  ],
  bho: [
    "कस्टमाइज्ड एआई वीडियो ट्यूटर वर्कस्पेस में राउर स्वागत बा।",
    "ई प्लेयर बिना कवनो वीडियो टैग के पूरा तरह से कैनवास स्क्रीन पर चलेला।",
    "रउआ प्लेबैक के गति के ठीक कर सकत बानी, सबटाइटल्स चुन सकत बानी, या ऑडियो अनुवाद बदल सकत बानी।"
  ],
  bi: [
    "Welkam long custom AI Video Tutor wokspeis.",
    "Pleia ia i ran fulwan long wan kanvas skrin we i no gat eni video tag.",
    "Yu save jenisim spid blong pleibak, jusum ol subtitel, o jenisim ol odio translesen."
  ],
  bg: [
    "Добре дошли в персонализираното работно пространство на AI Video Tutor.",
    "Този плейър работи изцяло върху платно без никакви видео тагове.",
    "Можете да регулирате скоростта на възпроизвеждане, да избирате субтитри или да превключвате аудио преводи."
  ],
  my: [
    "စိတ်ကြိုက်ပြင်ဆင်ထားသော AI ဗီဒီယို ကျူတာ လုပ်ငန်းခွင်မှ ကြိုဆိုပါသည်။",
    "ဤပလေယာသည် မည်သည့်ဗီဒီယိုတဂ်များမျှမပါဘဲ ကွက်လပ်မျက်နှာပြင်ပေါ်တွင် လုံးဝအလုပ်လုပ်သည်။",
    "သင်သည် ပြန်ဖွင့်နှုန်းကို ချိန်ညှิနိုင်သည်၊ စာတန်းထိုးများကို ရွေးချယ်နိုင်သည် သို့မဟုတ် အသံဘာသာပြန်ချက်များကို ပြောင်းလဲနိုင်သည်။"
  ],
  yue: [
    "歡迎來到自訂 AI 影片導師工作區。",
    "呢個播放器完全喺畫布螢幕上運行，唔需要任何影片標籤。",
    "你可以調整播放速度、選擇字幕，或者切換語音翻譯。"
  ],
  ca: [
    "Benvingut a l'espai de treball personalitzat de l'AI Video Tutor.",
    "Aquest reproductor funciona completament en una pantalla de llenç sense cap etiqueta de vídeo.",
    "Podeu ajustar la velocitat de reproducció, seleccionar els subtítols o canviar les traduccions d'àudio."
  ],
  ceb: [
    "Maayong pag-abot sa custom AI Video Tutor workspace.",
    "Kini nga player modagan sa hingpit sa usa ka canvas screen nga walay bisan unsang mga video tag.",
    "Mahimo nimong i-adjust ang playback rate, mopili sa mga subtitle, o mobalhin sa mga audio translation."
  ],
  ch: [
    "Bienbenidu gi manma'tinas na AI Video Tutor na lugat para macho'cho'.",
    "Este na player gumugupu enteramente gi canvas na iskrin sin ni un tag bideo.",
    "Siña un na'dinanchi i playback rate, ayek i subtitle, pat tulaika i audio na traducian."
  ],
  zh: [
    "欢迎来到自定义 AI 视频导师工作区。",
    "该播放器完全在画布屏幕上运行，无需任何视频标签。",
    "您可以调整播放速度、选择字幕或切换语音翻译。"
  ],
  hr: [
    "Dobrodošli u prilagođeni radni prostor AI Video Tutor-a.",
    "Ovaj player radi u potpunosti na zaslonu platna bez ikakvih video oznaka.",
    "Možete prilagoditi brzinu reprodukcije, odabrati titlove ili promijeniti prijevode zvuka."
  ],
  cs: [
    "Vítejte v přizpůsobeném pracovním prostoru AI Video Tutor.",
    "Tento přehrávač běží zcela na plátně bez jakýchkoli značek videa.",
    "Můžete upravit rychlost přehrávání, vybrat titulky nebo přepnout zvukové překlady."
  ],
  da: [
    "Velkommen til det tilpassede AI Video Tutor-arbejdsområde.",
    "Denne afspiller kører helt på en lærredsskærm uden nogen videotags.",
    "Du kan justere afspilningshastigheden, vælge undertekster of skifte lydoversættelser."
  ],
  doi: [
    "कस्टम एआई वीडियो ट्यूटर वर्कस्पेस पर थुआड़ा स्वागत ऐ।",
    "ए प्लेयर बिना किसी वीडियो टैग दे पूरी चाला कन्नै कैनवास स्क्रीन पर चलदा ऐ।",
    "तुस प्लेबैक दी रफ़्तार गी नियंत्रित करी सकदे ओ, सबटाइटल्स चुनी सकदे ओ, या आडियो अनुवाद बदली सकदे ओ।"
  ],
  nl: [
    "Welkom bij de aangepaste AI Video Tutor-werkruimte.",
    "Deze speler draait volledig op een canvas-scherm zonder videotags.",
    "U kunt de afspeelsnelheid aanpassen, ondertitels selecteren of audiovertalingen wijzigen."
  ],
  en: [
    "Welcome to the custom AI Video Tutor workspace.",
    "This player runs completely on a canvas screen without any video tags.",
    "You can adjust playback rate, select subtitles, or switch audio translations."
  ],
  et: [
    "Tere tulemast kohandatud AI Video Tutor tööruumi.",
    "See mängija töötab täielikult lõuendi ekraanil ilma videotääkideta.",
    "Saate reguleerida taasesituse kiirust, valida subtiitreid või vahetada helitõlkeid."
  ],
  fj: [
    "Kidavaki mai ki na vanua ni cakacaka ni AI Video Tutor.",
    "Na dauqito oqo e qito taucoko sara ga ena dua na sikrin ni tapolen ka sega kina na videotag.",
    "E rawa ni o veisautaka na totolo ni qito, digitaka na subtitle, se veisautaka na vakadewa ni rorogo."
  ],
  tl: [
    "Maligayang pagdating sa custom na AI Video Tutor workspace.",
    "Ang player na ito ay ganap na gumagana sa isang canvas screen nang walang any video tag.",
    "Maaari mong ayusin ang bilis ng playback, pumili ng mga subtitle, o lumipat ng mga pagsasalin ng audio."
  ],
  fi: [
    "Tervetuloa mukautettuun AI Video Tutor -työtilaan.",
    "Tämä soitin toimii täysin kangasnäytöllä ilman videotunnisteita.",
    "Voit säätää toistonopeutta, valita tekstityksiä tai vaihtaa äänikäännöksiä."
  ],
  fr: [
    "Bienvenue dans l'espace de travail personnalisé de l'AI Video Tutor.",
    "Ce lecteur fonctionne entièrement sur un écran canevas sans aucune balise vidéo.",
    "Vous pouvez ajuster la vitesse de lecture, sélectionner les sous-titres ou changer de traduction audio."
  ],
  gl: [
    "Benvido ao espazo de traballo personalizado de AI Video Tutor.",
    "Este reprodutor funciona completamente nunha pantalla de lenzo sen ningunha etiqueta de bideo.",
    "Podes axustar la velocidade de reprodución, seleccionar os subtítulos ou cambiar as traducións de audio."
  ],
  ka: [
    "კეთილი იყოს თქვენი მობრძანება AI Video Tutor-ის სამუშაო სივრცეში.",
    "ეს პლეერი მუშაობს მთლიანად ტილოს ეკრანზე ყოველგვარი ვიდეო ტეგების გარეშე.",
    "შეგიძლიათ დაარეგულიროთ დაკვრის სიჩქარე, აირჩიოთ სუბტიტრები ან შეცვალოთ აუდიო თარგმანები."
  ],
  de: [
    "Willkommen im benutzerdefinierten AI Video Tutor Arbeitsbereich.",
    "Dieser Player läuft vollständig auf einem Canvas-Bildschirm ohne jegliche Video-Tags.",
    "Sie können die Wiedergabegeschwindigkeit anpassen, Untertitel auswählen oder die Audioübersetzung wechseln."
  ],
  el: [
    "Καλώς ορίσατε στον προσαρμοσμένο χώρο εργασίας του AI Video Tutor.",
    "Αυτό το πρόγραμμα αναπαραγωγής λειτουργεί πλήρως σε οθόνη καμβά χωρίς ετικέτες βίντεο.",
    "Μπορείτε να προσαρμόσετε την ταχύτητα αναπαραγωγής, να επιλέξετε υπότιτλους ή να αλλάξετε ηχητικές μεταφράσεις."
  ],
  kl: [
    "Tikilluarit nammineq AI Video Tutor-ip sullivianut.",
    "Isiginnaartitsisut una isiginnaarfimmi videotag-eqanngitsumi ingerlasarpoq.",
    "Ingerlanerata sukkassusia naammattorsarsinnaavat, oqaasertat toqqarlugit, imaluunniit nipip nutserneqarnera taarsersinnaavat."
  ],
  gu: [
    "કસ્ટમ AI વિડિઓ ટ્યુટર વર્કસ્પેસમાં આપનું સ્વાગત છે.",
    "આ પ્લેયર કોઈપણ વિડિઓ ટેગ વિના સંપૂર્ણપણે કેનવાસ સ્ક્રીન પર ચાલે છે.",
    "તમે પ્લેબેક રેટને સમાયોજિત કરી શકો છો, સબટાઈટલ પસંદ કરી શકો છો અથવા ઑડિઓ અનુવાદ બદલી શકો છો."
  ],
  ha: [
    "Barka da zuwa dakin aiki na musamman na AI Video Tutor.",
    "Wannan mai kunnawa yana aiki gabaɗaya akan allon zane ba tare da alamun bidiyo ba.",
    "Kuna iya daidaita saurin kunnawa, zaɓi fassarar rubutu, ko canza fassarar sauti."
  ],
  haw: [
    "E komo mai i ka wahi hana AI Video Tutor i hoʻopilikino ʻia.",
    "Holo piha kēia mea pāʻani ma ka pale canvas me ka ʻole o nā lepili wikiō.",
    "Hiki iā ʻoe ke hoʻololi i ka wikiwiki o ka pāʻani, koho i nā huaʻōlelo lalo, a i ʻole e hoʻololi i nā unuhi leo."
  ],
  he: [
    "ברוכים הבאים לסביבת העבודה המותאمة אישית של AI Video Tutor.",
    "נגן זה פועל לחלוטין על גבי מסך קנבס ללא תגי וידאו כלשהם.",
    "באפשרותכם לכוונן את מהירות הניגون, לבחור כתוביות או להחליף תרגומי שمع."
  ],
  hi: [
    "कस्टम एआई वीडियो ट्यूटर वर्कस्पेस में आपका स्वागत है।",
    "यह प्लेयर बिना किसी वीडियो टैग के पूरी तरह से कैनवास स्क्रीन पर चलता है।",
    "आप प्लेबैक दर को समायोजित कर सकते हैं, उपशीर्षक चुन सकते हैं, या ऑडियो अनुवाद बदल सकते हैं।"
  ],
  hu: [
    "Üdvözöljük az egyedi AI Video Tutor munkaterületen.",
    "Ez a lejátszó teljesen egy vászon képernyőn fut, videócímkék nélkül.",
    "Beállíthatja a lejátszási sebességet, kiválaszthatja a feliratokat, vagy válthat a hangfordítások között."
  ],
  is: [
    "Velkomin á sérsniðna AI Video Tutor vinnusvæðið.",
    "Þessi spilari keyrir algjörlega á striga án nokkurra myndbandamerkja.",
    "Þú getur stillt spilunarhraða, valið undirtitla eða skipt um hljóðþýðingar."
  ],
  ig: [
    "Nnabata na oghere ọrụ AI Video Tutor emebere gị.",
    "Ihe ọkpụkpọ a na-agba kpamkpam na ihuenyo canvas na-enweghị mkpado vidiyo ọ bụla.",
    "Ị nwere ike ịgbanwe ọsọ ọkpụkpọ, họrọ ndepụta okwu, ma ọ bụ gbanwee nsụgharị ọdịyo."
  ],
  id: [
    "Selamat datang di ruang kerja AI Video Tutor kustom.",
    "Pemutar ini berjalan sepenuhnya pada layar kanvas tanpa tag video apa pun.",
    "Anda dapat menyesuaikan kecepatan putar, memilih subtitle, atau mengganti terjemahan audio."
  ],
  ga: [
    "Fáilte chuig spás oibre saincheaptha AI Video Tutor.",
    "Ritheann an seinnteoir seo go hiomlán ar scáileán chanbháis gan aon chlibeanna físe.",
    "Is féidir leat an ráta athsheinm a choigeartú, fotheidil a roghnú, nó aistriúcháin fuaime a athrú."
  ],
  it: [
    "Benvenuto nell'area di lavoro personalizzata di AI Video Tutor.",
    "Questo lettore funziona interamente su uno schermo canvas senza tag video.",
    "Puoi regolare la velocità di riproduzione, selezionare i sottotitoli o cambiare la traduzione audio."
  ],
  ja: [
    "カスタム AI ビデオチューターワークスペースへようこそ。",
    "このプレイヤーはビデオタグを使用せず、完全にキャンバス画面上で動作します。",
    "再生速度の調整、字幕の選択、音声翻訳の切り替えが可能です。"
  ],
  jv: [
    "Sugeng rawuh ing papan kerja AI Video Tutor kustom.",
    "Pamuter iki mlaku sakabehe ing layar kanvas tanpa tag video apa wae.",
    "Sampeyan bisa nyetel kacepetan muter, milih subtitle, utawa ngganti terjemahan audio."
  ],
  kn: [
    "ಕಸ್ಟಮ್ AI ವಿಡಿಯೋ ಟ್ಯೂಟರ್ ಕಾರ್ಯಕ್ಷೇತ್ರಕ್ಕೆ ಸುಸ್ವಾಗತ.",
    "ಈ ಪ್ಲೇಯರ್ ಯಾವುದೇ ವೀಡಿಯೊ ಟ್ಯಾಗ್‌ಗಳಿಲ್ಲದೆ ಸಂಪೂರ್ಣವಾಗಿ ಕ್ಯಾನ್ವಾಸ್ ಪರದೆಯ ಮೇಲೆ ರನ್ ಆಗುತ್ತದೆ.",
    "ನೀವು ಪ್ಲೇಬ್ಯಾಕ್ ವೇಗವನ್ನು ಹೊಂದಿಸಬಹುದು, ಉಪಶೀರ್ಷಿಕೆಗಳನ್ನು ಆಯ್ಕೆ ಮಾಡಬಹುದು ಅಥವಾ ಆಡಿಯೊ ಅನುವಾದಗಳನ್ನು ಬದಲಾಯಿಸಬಹುದು."
  ],
  ks: [
    "کسٹم AI ویڈیو ٹیوٹر ورک اسپیسس منز چھو توہہ خوش آمدید۔",
    "یہ پلیئر چھو ویڈیو ٹیگہ بغیر مکمل طور کینوس اسکرین پر چلان۔",
    "توہہ ہیکو پلے بیک رفتار ایڈجسٹ کرتھ، سب ٹائٹل منتخب کرتھ، یا آڈیو ترجمہ تبدیل کرتھ।"
  ],
  kk: [
    "AI Video Tutor теңшелмелі жұмыс кеңістігіне қош келдіңіз.",
    "Бұл ойнатқыш ешқандай видео тегтерінсіз толығымен кенеп экранында жұмыс істейді.",
    "Ойнату жылдамдығын реттей аласыз, субтитрлерді таңдай аласыз немесе аудио аудармаларды ауыстыра аласыз."
  ],
  km: [
    "សូមស្វាគមន៍មកកាន់កន្លែងធ្វើការ AI Video Tutor ផ្ទាល់ខ្លួន។",
    "កម្មវិធីចាក់នេះដំណើរการទាំងស្រុងលើអេក្រង់ផ្ទាំងក្រណាត់ដោយគ្មានស្លាកវីដេអូណាមួយឡើយ。",
    "អ្នកអាចលៃតម្រូវល្បεύនចាក់ឡើងវិញ ជ្រើសរើសចំណងជើងរង ឬផ្លាស់ប្តូរការបកប្រែអូឌីយ៉ូ។"
  ],
  rw: [
    "Ikaze mwanya w'akazi kagenewe AI Video Tutor.",
    "Uyu mukinnyi ukora rwose kuri ecran ya canvas nta kimenyetso cya video na kimwe gishyizwemo.",
    "Urashobora guhindura umuvuduko w'imikino, guhitamo ibisubizo, cyangwa guhindura amajwi y'indimi."
  ],
  kok: [
    "कस्टमाईझ्ड एआय व्हीडिओ ट्यूटर कार्यक्षेत्रांत तुमचें स्वागत आसा.",
    "हो प्लेयर खंयच्याच व्हीडिओ टॅगा बगर पुरायपणान कॅनव्हास स्क्रीनचेर चलता.",
    "तुमची प्लेबॅक गती जुळोवन घेवंक शकता, सबटायटल्स वेंचून काडूंक शकता, वा ऑडिओ अणकार बदलूंक शकता।"
  ],
  ko: [
    "맞춤형 AI 비디오 튜터 워크스페이스에 오신 것을 환영합니다.",
    "이 플레이어는 비디오 태그 없이 캔버스 화면에서 완전히 실행됩니다.",
    "재생 속도를 조절하거나, 자막을 선택하거나, 오디오 번역을 전환할 수 있습니다."
  ],
  ku: [
    "Bi xêr hatin qada xebatê ya taybet a AI Video Tutor.",
    "Ev lîstikvan bi tevahî li ser ekranek canvas bêyî ti nîşaneyên vîdyoyê dixebite.",
    "Hûn dikarin leza lîstikê eyar bikin, jêrnivîsan hilbijêrin, an wergerên bihîstbar biguherînin."
  ],
  ky: [
    "AI Video Tutor ыңғайлаштырылган жумушчу мейкиндигине кош келиңиз.",
    "Бул оюнчу эч кандай видео тегдери жок толугу менен кенеп экранында иштейт.",
    "Сиз ойнотуу ылдамдыгын тууралай аласыз, субтитрлерді тандай аласыз же аудио котормолорду алмаштыра аласыз."
  ],
  lo: [
    "ຍິນດີຕ້อนຮັບເຂົ້າສູ່ພື້ນທີ່ເຮັດວຽກ AI Video Tutor ທີ່ກຳນົດເອງ.",
    "ເຄື່ອງຫຼິ້ນນີ້ເຮັດວຽກຢ່າງສົມບູນໃນໜ້າຈໍຜ້າໃบໂດຍບໍ່ມີແທັກວິດີໂອໃດໆ.",
    "ທ່ານສາມາດປັບອັດຕາການຫຼິ້ນ, ເລືອກຄຳບັນຍາຍ, ຫຼືປ່ຽນການແປສຽງໄດ້."
  ],
  lv: [
    "Laipni lūdzam pielāgotajā AI Video Tutor darba telpā.",
    "Šis atskaņotājs pilnībā darbojas uz audekla ekrāna bez jebkādiem video tagiem.",
    "Varat pielāgot atskaņošanas ātrumu, izvēlēties subtitrus vai pārslēgt audio tulkojumus."
  ],
  lt: [
    "Sveiki atvykę į individualizuotą „AI Video Tutor“ darbo erdvę.",
    "Šis grotuvas veikia visiškai drobės ekrane be jokių vaizdo žymų.",
    "Galite reguliuoti atkūrimo greitį, pasirinkti subtitrus arba perjungti garso vertimus."
  ],
  lb: [
    "Wëllkomm am personaliséierten AI Video Tutor Aarbechtsberäich.",
    "Dëse Player leeft komplett op engem Canvas-Bildschierm ouni Video-Tags.",
    "Dir kënnt d'Wiedergabegeschwindegkeet upassen, Ënneritelen auswielen oder d'Audio-Iwwersetzung wiesselen."
  ],
  mk: [
    "Добредојдовте во прилагодениот работен простор на AI Video Tutor.",
    "Овој плеер работи целосно на екран со платно без никакви видео ознаки.",
    "Може да ја прилагодите брзината на репродукција, да изберете титлови или да ги менувате аудио преводите."
  ],
  mai: [
    "कस्टमाइज्ड एआई वीडियो ट्यूटर वर्कस्पेस में अहांक स्वागत अछि।",
    "ई प्लेयर बिना कोनो वीडियो टैग के पूरा तरह स कैनवास स्क्रीन पर चलैत अछि।",
    "अहां प्लेबैक गति के समायोजित क सकैत छी, सबटाइटल्स चुनि सकैत छी, या ऑडियो अनुवाद बदलि सकैत छी।"
  ],
  mg: [
    "Tongasoa eto amin'ny sehatr'asa manokana ho an'ny AI Video Tutor.",
    "Ity mpilalao ity dia mandeha tanteraka amin'ny efijery canvas tsy misy marika video.",
    "Azonao atao ny manitsy ny hafainganam-pandeha, misafidy dikanteny, na manova ny fandikan-teny feo."
  ],
  ms: [
    "Selamat datang ke ruang kerja kustom AI Video Tutor.",
    "Pemain ini berjalan sepenuhnya pada skrin kanvas tanpa sebarang tag video.",
    "Anda boleh melaraskan kadar main balik, memilih sari kata, atau menukar terjemahan audio."
  ],
  ml: [
    "ഇഷ്ടാനുസൃത AI വീഡിയോ ട്യൂട്ടർ വർക്ക്സ്പേസിലേക്ക് സ്വാഗതം.",
    "ഈ പ്ലെയർ വീഡിയോ ടാഗുകൾ ഒന്നുമില്ലാതെ പൂർണ്ണമായും ക്യാൻവാസ് സ്ക്രീനിൽ പ്രവർത്തിക്കുന്നു.",
    "നിങ്ങൾക്ക് പ്ലേബാക്ക് നിരക്ക് ക്രമീകരിക്കാനും സബ്ടൈറ്റിലുകൾ തിരഞ്ഞെടുക്കാനും അല്ലെങ്കിൽ ഓഡിയോ വിവർത്തനങ്ങൾ മാറ്റാനും കഴിയും."
  ],
  mt: [
    "Merħba fl-ispazju tax-xogħol personalizzat tal-AI Video Tutor.",
    "Dan il-player jaħdem kompletament fuq skrin tal-canvas mingħajr l-ebda tags tal-video.",
    "Tanda taġġusta r-rata tal-playback, tagħżel is-sottotitoli, jew taqleb it-traduzzjonijiet tal-awdjo."
  ],
  mni: [
    "কস্তম AI ভিদিও ত্যুতর ৱর্কস্পেস্তা তরাম্না ওকচরি।",
    "প্লেয়র অসি ভিদিও তেক অমত্তা য়াওদনা ক্যানভাস স্ক্রিন্দা চৎথৈ।",
    "অদোম্না প্লেবেক রেত শেমদোক-শেমজিন تৌবা, সবতাইতল খনবা, নত্রগা অদিও হন্দোকপা য়াই।"
  ],
  mi: [
    "Nau mai ki te wāhi mahi AI Video Tutor kua whakaritea.",
    "E rere katoa ana tēnei kaitākaro ki runga i te mata canvas kāore he tohu ataata.",
    "Ka taea e koe te whakatika i te tere tākaro, te kōwhiri i ngā taitara, te huri rānei i ngā whakamāoritanga oro."
  ],
  mr: [
    "सानुकूल AI व्हिडिओ ट्यूटर वर्कस्पेसमध्ये आपले स्वागत आहे.",
    "हा प्लेयर कोणत्याही व्हिडिओ टॅगशिवाय पूर्णपणे कॅनव्हास स्क्रीनवर चालतो.",
    "आपण प्लेबॅक दर समायोजित करू शकता, उपशीर्षके निवडू शकता किंवा ऑडिओ अनुवाद बदलू शकता."
  ],
  mn: [
    "Тохируулсан AI Видео Багшийн ажлын хэсэгт тавтай морилно уу.",
    "Энэ тоглуулагч нь видео шошгогүйгээр бүхэлдээ зурагт дэлгэц дээр ажилладаг.",
    "Та тоглуулах хурдыг тохируулах, хадмал орчуулго сонгох, эсвэл аудио орчуулгыг солих боломжтой."
  ],
  ne: [
    "अनुकूलित एआई भिडियो ट्युटर कार्यस्थानमा तपाईंलाई स्वागत छ।",
    "यो प्लेयर कुनै पनि भिडियो ट्याग बिना पूर्ण रूपमा क्यानभास स्क्रिनमा चल्छ।",
    "तपाईं प्लेब्याक दर समायोजन गर्न, उपशीर्षकहरू चयन गर्न, वा अडियो अनुवादहरू स्विच गर्न सक्नुहुन्छ।"
  ],
  no: [
    "Velkommen til det tilpassede AI Video Tutor-arbeidsområdet.",
    "Denne spilleren kjører helt på en lærretsskjerm uten noen videotagger.",
    "Du kan justere avspillingshastigheten, velge undertekster eller bytte lydoversettelser."
  ],
  or: [
    "କଷ୍ଟମ୍ AI ଭିଡିଓ ଟ୍ୟୁଟର୍ ୱର୍କସ୍ପେସକୁ ସ୍ୱାଗତ।",
    "ଏହି ପ୍ଲେୟାର୍ କୌଣସି ଭିଡିଓ ଟ୍ୟାଗ୍ ବିନା ସମ୍ପୂର୍ଣ୍ଣ କ୍ୟାନଭାସ୍ ସ୍କ୍ରିନରେ ଚାଲିଥାଏ।",
    "ଆପଣ ପ୍ଲେବ୍ୟାକ୍ ହାର ସମାଯୋଜନ କରିପାରિବେ, ସବ୍‌ଟାଇਟଲ୍ ଚୟន କରିପାରિବେ କିମ୍ବା ଅଡିଓ ଅନੁବାද ବਦଳାଇ ପାରିବେ।"
  ],
  om: [
    "Gara iddoo hojii koochiin viidiyoo AI kan dhuunfaatti simannaa qopheessineetti baga nagaan dhuftan.",
    "Taphaataan kun mallattoo viidiyoo tokko malee guutummaatti iskiriinii tiyatoorii irratti hojjata.",
    "Saffisa taphaa sirreessuu, barreeffama jalaa filachuu ykn hiikkaa sagalee jijjiuruu dandeessu."
  ],
  ps: [
    "د مراجع AI ویډیو ټیوټر کاري ځای ته ښه راغلاست.",
    "دا پلیر په بشپړ ډول د کینوس په سکرین کې پرته له کوم ویډیو ټاګونو چلیږي.",
    "تاسو کولی شئ د غږولو سرعت تنظیم کړئ, فرعي سرلیکونه غوره کړئ, یا غږیز ژباړې بدل کړئ."
  ],
  fa: [
    "به فضای کاری سفارشی معلم ویدیویی هوش مصنوعی خوش آمدید.",
    "این پخش کننده کاملاً بدون هیچ تگ ویدیویی روی یک صفحه بوم اجرا می شود.",
    "می توانید سرعت پخش را تنظیم کنید، زیرنویس ها را انتخاب کنید یا ترجمه های صوتی را تغییر دهید."
  ],
  pl: [
    "Witamy w spersonalizowanym obszarze roboczym AI Video Tutor.",
    "Ten odtwarzacz działa całkowicie na ekranie płótna bez żadnych tagów wideo.",
    "Możesz dostosować prędkość odtwarzania, wybrać napisy lub przełączyć tłumaczenia audio."
  ],
  pt: [
    "Bem-vindo ao espaço de trabalho personalizado do AI Video Tutor.",
    "Este reprodutor funciona totalmente em uma tela canvas sem nenhuma tag de vídeo.",
    "Pode ajustar a velocidade de reprodução, selecionar legendas ou alternar traduções de áudio."
  ],
  pa: [
    "ਕਸਟਮ AI ਵੀਡੀਓ ਟਿਊਟਰ ਵਰਕਸਪੇਸ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ।",
    "ਇਹ ਪਲੇਅਰ ਬਿਨਾਂ ਕਿਸੇ ਵੀਡੀਓ ਟੈਗ ਦੇ ਪੂਰੀ ਤਰ੍ਹਾਂ ਕੈਨਵਸ ਸਕ੍ਰੀਨ 'ਤੇ ਚੱਲਦਾ ਹੈ।",
    "ਤੁਸੀਂ ਪਲੇਬੈਕ ਦੀ ਦਰ ਨੂੰ ਅਨੁਕੂਲ ਕਰ ਸਕਦੇ ਹੋ, ਸਬਟਾਈਟਲ ਚੁਣ ਸਕਦੇ ਹੋ, ਜਾਂ ਆਡੀਓ ਅਨੁਵਾਦ ਬਦਲ ਸਕਦੇ ਹਨ।"
  ],
  ro: [
    "Bun venit în spațiul de lucru personalizat AI Video Tutor.",
    "Acest player rulează complet pe un ecran canvas, fără etichete video.",
    "Puteți regla viteza de redare, selecta subtitrări sau schimba traducerile audio."
  ],
  ru: [
    "Добро пожаловать в персонализированное рабочее пространство AI Video Tutor.",
    "Этот проигрыватель работает полностью на холсте без каких-либо видеотегов.",
    "Вы можете настроить скорость воспроизведения, выбрать субтитры или переключить аудиоперевод."
  ],
  sm: [
    "Afio mai i le avanoa faigaluega masani a le AI Video Tutor.",
    "O lenei tagata taalo e tamoʻe atoa i luga o se lau canvas e aunoa ma ni pine vitio.",
    "E mafai ona e fetuunai le saoasaoa o le taalo, filifili ni faaupuga, pe sui le leo o faaliliuga."
  ],
  sa: [
    "वैयक्तिकृत-कृत्रिमबुद्धि-चलचित्र-शिक्षक-कार्यक्षेत्रे भवतां स्वागतम्।",
    "एषः क्रीडकः किमपि चलचित्रसूचकं विना पूर्णतया चित्रपटले प्रचलति।",
    "भवान् क्रीडनवेगं व्यवस्थापयितुं, उपशीर्षकं चिनोतुं वा श्रव्यभाषांतरं परिवर्तयितुं शक्नोति।"
  ],
  sat: [
    "ᱠᱟᱥᱴᱚᱢ AI ᱵᱷᱤᱰᱤᱭᱳ ᱴᱤᱣᱴᱚᱨ ᱠᱟᱹᱢᱤ ᱴᱷᱟᱶ ᱨᱮ ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ᱾",
    "ᱱᱚᱣᱟ ᱯᱞᱮᱭᱟᱨ ᱫᱚ ᱵᱷᱤᱰᱤᱭᱳ ᱴᱮᱜᱽ ᱵᱮᱜᱚᱨ ᱜᱮ ᱠᱮᱱᱵᱷᱟᱥ ᱥᱠᱨᱤᱱ ᱨᱮ ᱪᱟᱞᱟᱜᱼᱟ᱾",
    "ᱟᱢ ᱯᱞᱮᱵᱮᱠ ᱫᱚᱨ ᱥᱟᱡᱟᱣ, ᱥᱟᱵᱽᱴᱟᱭᱤᱴᱮᱞ ᱵᱟᱪᱷᱟᱣ ᱥᱮ ᱟᱲᱟᱝ ᱛᱚᱨᱡᱚམᱟ ᱵᱚᱫᱚܠ ᱫᱟᱲေᱭᱟᱜᱼᱟᱢ᱾"
  ],
  sr: [
    "Добродошли у прилагођени радни простор AI Video Tutor-а.",
    "Овај плејер ради у потпуности на екрану платна без икаквих видео ознака.",
    "Можете прилагодити брзину репродукције, изабрати титлове или променити аудио преводе."
  ],
  sd: [
    "ڪسٽم AI وڊيو ٽيوٽر ڪم واري جاءِ تي ڀليڪار.",
    "هي پليئر بغير ڪنهن وڊيو ٽيگ جي مڪمل طور تي ڪينواس اسڪرين تي هلي ٿو.",
    "توهان پليبيڪ جي رفتار کي ترتيب ڏئي سگهو ٿا، سب ٽائيٽل چونڊي سگهو ٿا، يا آڊيو ترجمو تبديل ڪري سگهو ٿا."
  ],
  si: [
    "අභිරුචි AI වීඩියෝ උපදේශක වැඩබිම වෙත සාදරයෙන් පිළිගනිමු.",
    "මෙම ධාවකය කිසිදු වීඩියෝ ටැගයක් නොමැතිව සම්පූර්ණයෙන්ම කැන්වස් තිරයක් මත ක්‍රියාත්මක වේ.",
    "ඔබට ධාවන වේගය ගැලපීම, උපසිරැසි තෝරා ගැනීම හෝ ශ්‍රව්‍ය පරිවර්තන මාරු කිරීම කළ හැක."
  ],
  sk: [
    "Vitajte v prispôsobenom pracovnom priestore AI Video Tutor.",
    "Tento prehrávač beží úplne na plátne bez akýchkoľvek video tagov.",
    "Môžete upraviť rýchlosť prehrávania, vybrať titulky alebo prepnúť zvukové preklady."
  ],
  sl: [
    "Dobrodošli v prilagojenem delovnem prostoru AI Video Tutor.",
    "Ta predvajalnik deluje v celoti na platnu brez kakršnih koli video oznak.",
    "Prilagodite lahko hitrost predvajanja, izberete podnapise ali preklopite zvočne prevode."
  ],
  so: [
    "Ku soo dhawaada goobta shaqada ee AI Video Tutor ee gaarka ah.",
    "Cayaartoygaan wuxuu si buuxda ugu shaqeeyaa shaashadda canvas isagoon lahayn wax sumado muuqaal ah.",
    "Waxaad hagaajin kartaa xawaaraha dib u ciyaarista, dooran kartaa subtitles, ama beddeli kartaa tarjumaadaha maqalka."
  ],
  es: [
    "Bienvenido al espacio de trabajo personalizado de AI Video Tutor.",
    "Este reproductor funciona completamente en una pantalla de lienzo sin ninguna etiqueta de video.",
    "Puede ajustar la velocidad de reproducción, seleccionar subtítulos o cambiar las traducciones de audio."
  ],
  su: [
    "Wilujeng sumping di ruang kerja AI Video Tutor kustom.",
    "Pamuter ieu jalan sagemblengna dina layar kanvas tanpa tag video naon waé.",
    "Anjeun tiasa nyaluyukeun laju muterkeun, milih terjemahan téks, atanapi ngagentos terjemahan audio."
  ],
  sw: [
    "Karibu kwenye nafasi ya kazi ya AI Video Tutor maalum.",
    "Kichezaji hiki kinafanya kazi kikamilifu kwenye skrini ya turubai bila lebo zozote za video.",
    "Unaweza kurekebisha kasi ya kucheza, kuchagua manukuu, au kubadilisha tafsiri za sauti."
  ],
  sv: [
    "Välkommen till det anpassade arbetsområdet för AI Video Tutor.",
    "Den här spelaren körs helt på en dukskärm utan några videotaggar.",
    "Du kan justera uppspelningshastigheten, välja undertexter eller byta ljudöversättningar."
  ],
  tg: [
    "Ба фазои кории фармоишии AI Video Tutor хуш омадед.",
    "Ин плеер комилан дар экрани канвас бидуни ягон барчасбҳои видеоӣ кор мекунад.",
    "Шумо метавонед суръати бозиро танзим кунед, субтитрҳоро интихоб кунед ё тарҷумаҳои аудиоиро иваз кунед."
  ],
  ta: [
    "தனிப்பயன் AI வீடியோ ட்யூட்டர் பணிிடத்திற்கு வரவேற்கிறோம்.",
    "இந்த பிளேயர் எந்த வீடியோ குறிச்சொல்லும் இல்லாமல் முழுமையாக கேன்வாஸ் திரையில் இயங்குகிறது.",
    "நீங்கள் பின்னணி வேகத்தை சரிசெய்யலாம், வசனங்களை தேர்வு செய்யலாம் அல்லது ஆடியோ மொழிபெயர்ப்புகளை மாற்றலாம்."
  ],
  te: [
    "కస్టమ్ AI వీడియో ట్యూటర్ వర్క్‌స్పేస్‌కు స్వాగతం.",
    "ఈ ప్లేయర్ ఎలాంటి వీడియో ట్యాగ్‌లు లేకుండా పూర్తిగా కాన్వాస్ స్క్రీన్‌పై రన్ అవుతుంది.",
    "మీరు ప్లేబ్యాక్ వేగాన్ని సర్దుబాటు చేయవచ్చు, ఉపశీర్షికలను ఎంచుకోవచ్చు లేదా ఆడియో అనువాదాలను మార్చవచ్చు."
  ],
  th: [
    "ยินดีต้อนรับสู่พื้นที่ทำงาน AI Video Tutor แบบกำหนดเอง",
    "เครื่องเล่นนี้ทำงานบนหน้าจอผืนผ้าใบทั้งหมดโดยไม่มีแท็กวิดีโอใดๆ",
    "คุณสามารถปรับอัตราการเล่น เลือกคำบรรยาย หรือสลับการแปลเสียงได้"
  ],
  to: [
    "Tali fiefia ki he feitu'u ngāue AI Video Tutor fakafo'ituitui.",
    "Ko e me'a tā vitio ko 'eni 'oku lele kotoa ia 'i ha la'i pālani ta'e 'i ai ha ngaahi faka'ilonga vitio.",
    "E lava ke ke fe'unu'aki e vave 'o e tā, fili e ngaahi fakamatala 'i lalo, pe liliu e ngaahi lea faka-totonu."
  ],
  tr: [
    "Özel AI Video Tutor çalışma alanına hoş geldiniz.",
    "Bu oynatıcı, herhangi bir video etiketi olmadan tamamen bir tuval ekranında çalışır.",
    "Oynatma hızını ayarlayabilir, altyazıları seçebilir veya sesli çevirileri değiştirebilirsiniz."
  ],
  tk: [
    "Ýöriteleşdirilen AI Video Tutor iş meýdançasyna hoş geldiňiz.",
    "Bu pleýer wideo belligi bolmazdan, doly kanwas ekranynda işleýär.",
    "Goýberiş tizligini sazlap, subtitrleri saýlap bilersiňiz ýa-da audio terjimelerini çalşyp bilersiňiz."
  ],
  uk: [
    "Ласкаво просимо до персоналізованого робочого простору AI Video Tutor.",
    "Цей програвач працює повністю на екрані полотна без будь-яких відеотегів.",
    "Ви можете налаштувати швидкість відтворення, вибрати субтитри або переключити аудіопереклад."
  ],
  ur: [
    "کسٹم AI ویڈیو ٹیوٹر ورک اسپیس میں خوش آمدید۔",
    "یہ پلیئر بغیر کسی ویڈیو ٹیگ کے مکمل طور پر کینوس اسکرین پر چلتا ہے۔",
    "آپ پلے بیک کی رفتار کو ایڈجسٹ کر سکتے ہیں، سب ٹائٹل منتخب کر سکتے ہیں، یا آڈیو ترجمہ تبدیل کر سکتے ہیں۔"
  ],
  uz: [
    "Shaxsiy AI Video Tutor ish joyiga xush kelibsiz.",
    "Ushbu pleer hech qanday video tegsiz butunlay tuval ekranida ishlaydi.",
    "Siz ijro etish tezligini sozlashingiz, taglavhalarni tanlashingiz yoki audio tarjimalarni almashtirishingiz mumkin."
  ],
  vi: [
    "Chào mừng bạn đến với không gian làm việc AI Video Tutor tùy chỉnh.",
    "Trình phát này chạy hoàn toàn trên màn hình canvas mà không có bất kỳ thẻ video nào.",
    "Bạn có thể điều chỉnh tốc độ phát, chọn phụ đề hoặc chuyển đổi bản dịch âm thanh."
  ],
  cy: [
    "Croeso i'r gweithle AI Video Tutor arferol.",
    "Mae'r chwaraewr hwn yn rhedeg yn gyfan gwbl ar sgrin gynfas heb unrhyw dagiau fideo.",
    "Gallwch addasu cyfradd chwarae, dewis is-deitlau, neu newid cyfieithiadau sain."
  ],
  xh: [
    "Wamkelekile kwindawo yokusebenza ye-AI Video Tutor elungiselelwe wena.",
    "Lo mdlali ubaleka ngokupheleleyo kwiscreen se-canvas ngaphandle kwazo naziphi na ithegi zevidiyo.",
    "Unokulungelelanisa izinga lokudlala, ukhethe imibhalo engezantsi, okanye utshintshe iinguqulelo ze-audio."
  ],
  zu: [
    "Siyakwamukela endaweni yokusebenza ye-AI Video Tutor eyenziwe ngezifiso.",
    "Lo mdlali usebenza ngokuphelele esikrinini se-canvas ngaphandle kwanoma yimaphi amathegi wevidiyo.",
    "Ungalungisa isilinganiso sokudlala, ukhethe imibhalo engezansi, noma ushintshe ukuhunyushwa komsindo."
  ]
};

// Generate WebVTT formatting for each language
const output = {};
for (const [langCode, lines] of Object.entries(translations)) {
  output[langCode] = `WEBVTT

1
00:00:00.500 --> 00:00:04.000
${lines[0]}

2
00:00:04.500 --> 00:00:09.500
${lines[1]}

3
00:00:10.000 --> 00:00:15.000
${lines[2]}`;
}

// Prepare file content to write
const fileContent = `// Auto-generated subtitle translation database for 109 languages
// Generated on: ${new Date().toISOString()}

const subtitles = ${JSON.stringify(output, null, 2)};

export default subtitles;
`;

// Ensure target directory exists and write subtitles.js
const targetDir = path.dirname(TARGET_PATH);
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFileSync(TARGET_PATH, fileContent, 'utf-8');
console.log(\`Successfully generated subtitles for \${Object.keys(output).length} languages!\`);
console.log(\`Saved output to: \${TARGET_PATH}\`);
