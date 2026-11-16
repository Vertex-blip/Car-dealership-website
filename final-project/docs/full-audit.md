# Apex Motors жобасын толық тексеру

Тексеру күні: 16 қараша 2026. Топ: SE-2507. Команда: Arsen, Kuttibay, Farabi, Muhammad.

Тексеру HTML, CSS, JavaScript, браузердегі аккаунт пен inquiry деректері, API, навигация және интерфейс бойынша жүргізілді. Төмендегі жергілікті нәтижелер түзетілген нұсқаға қатысты. Соңғы жарияланған нұсқаны тексеру бөлек көрсетілген.

## 1. Final Project критерийлерімен салыстыру

Жоба бұрынғы Apex Motors тақырыбын жалғастырады. Кемінде алты бет керек; жобада сегіз байланысқан бет бар: Home, Collection, Showroom, About, Inquiry, Account, Profile және Model finder.

Кестедегі ұпайлар тапсырманың салмағын көрсетеді. Бұл оқытушы қойған баға немесе 100 ұпайға кепілдік емес.

| Критерий | Ұпай | Тексеру нәтижесі |
| --- | ---: | --- |
| 1. Responsiveness | 10 | Grid/Flexbox және мобильді меню бар. Chromium тексеруінде жеті бет тоғыз енде екі режиммен қаралды; тіркелу формасы бөлек тексерілді. Кеңейтілген және қате көрсетілген формаларда да басқару элементтері жабылып қалмады. |
| 2. Hosting | 5 | Түзетілген нұсқа GitHub Pages-те жарияланды. Онлайн сайтта 11 негізгі және 16 қауіпсіздік тобы қайта өтті; күтпеген runtime/console/CSP/HTTP қатесі табылмады. |
| 3. Light/Dark | 5 | Таңдау localStorage-та сақталады. Беттер арасында ауысу, reload, басқа tab және Back арқылы оралу тексерілді. Ескі режимнің қайта көрінуі түзетілді. |
| 4. Design және UX | 20 | Автокөлік фотолары, ортақ қаріптер, аралықтар және навигация сақталған. Контраст, жасырын мобильді мәтіннің accessible name мәселесі және батырма атаулары түзетілді. Соңғы axe-core тексеруінің 52 күйінде анықталған violation және құрал қатесі жоқ. |
| 5. JavaScript | 25 | Sign Up, Log In, Profile, contact editing, inquiry, іздеу, сүзгі, сұрыптау және жеке сақталған көліктер жұмыс істейді. Бес form-да novalidate бар. HTML validation атрибуттары механизм ретінде қолданылмайды; қателер JavaScript арқылы бетте көрсетіледі. |
| 6. Button және UI effects | 5 | Hover, save feedback, counters, галерея және loading күйлері тексерілді. Reduced-motion таңдауы сақталады. Батырмалар тек безендіру үшін қойылмаған. |
| 7. External API | 10 | NHTSA vPIC көлік модельдерін береді. Нақты сегіз make үшін HTTP 200 алынды. Loading, error, retry, timeout, cache, бос нәтиже және request race жағдайлары тексерілді. Екі табылған API қатесі түзетілді. |
| 8. Тақырыпқа сәйкестік | 10 | Collection, showroom, shortlist, inquiry, profile және model research бір автокөлік таңдау процесіне байланысты. API дерегі нақты Apex stock немесе жергілікті баға ретінде көрсетілмейді. |
| 9. Presentation | 5 | 4:45 жоспары, төрт қатысушының рөлі, көрсетілетін мүмкіндіктер және резервтік скриншоттар дайын. Нақты репетиция мен бес минуттық қорғауды команда өзі өткізеді; код тесті оларды растаған жоқ. |
| 10. Code quality және organisation | 5 | Сегіз HTML бет, css/, js/, images/, assets/, vendor/ және docs/ бөлінген. Ортақ vehicle data қолданылады. Сақтау, аккаунт және API логикасының күрделі жерлерінде түсіндірме бар. Статикалық тексеруде жоғалған файл, duplicate ID және қате ARIA сілтемесі табылмады. |

Формалардан `required`, `pattern`, `minlength`, `maxlength`, `min`, `max` немесе `type="email"` арқылы browser validation қолданылмайтыны тексерілді. Email, password және phone ережелері сол өрістер бар формаларға қатысты; Model finder-ге пароль өрісі қажет емес.

## 2. Беттер мен басқару элементтері

| Бет | Қаралған мүмкіндіктер |
| --- | --- |
| index.html | Header/footer навигациясы, featured cars, категория сілтемелері, inquiry сілтемесі, counters, суреттер және collection link көшіру. |
| inventory.html | 17 көлік, мәтіндік іздеу, suggestions, пернетақпамен таңдау, category, үш sorting тәртібі, Saved сүзгісі, қосу/алу, бос нәтиже және URL-дегі q параметрі. |
| showroom.html | Сегіз thumbnail, негізгі сурет пен caption, Previous/Next, шетіне жеткенде айналу, Arrow/Home/End пернелері және showroom link көшіру. |
| about.html | More about Apex ашу/жабу, FAQ іздеу/тазалау, сәйкес жауаптарды ашу, literal арнайы таңбалар және rating сақтау. |
| inquiry.html | Contact/Preferences/Review, Back/Next, қате өрістер, prefill, сақтау, confirmation, clipboard, New inquiry және Reset. |
| account.html | Login/signup tabs, парольді Show/Hide, required/email/password/phone/confirmation, duplicate email, сәтті және қате login. |
| profile.html | Guest guard, пайдаланушы деректері, contact editing, жеке сақталған көліктер, сол аккаунттың inquiries және logout. |
| research.html | Make/year, API дерегі, filter, Collection-ге өтетін сілтемелер, error/retry, cache және pending сұраудан кейін Back арқылы оралу. |

Мобильді менюдің ашылуы, Escape, сыртқа басу, resize және навигациядан кейін жабылуы қаралды. Touch арқылы suggestion таңдау да тексерілді. Clipboard қолжетімсіз болса, интерфейс жалған «Copied» көрсетпейді.

## 3. Табылған және түзетілген мәселелер

### Браузер күйі және интерфейс

- Back/Forward Cache бұрынғы бетті JavaScript күйімен қайта аша алады. Басқа бетте немесе tab-та өзгертілген theme мен shortlist ескі күйде қалып қоятын. `pageshow` кезінде сақтау қайта оқылады.
- Басқа tab-та `localStorage.clear()` орындалса, inventory-дегі Saved саны жаңармайтын. `storage` оқиғасының `key=null` жағдайы өңделді.
- Сақтауға `999` сияқты rating түссе, «999 of 5» шығатын. Енді тек 1-5 аралығындағы бүтін мән қабылданады.
- Footer-дегі ұсақ мәтін, inactive stars, placeholder, form border, dark mode-та Saved мәтіні және inactive gallery labels жеткілікті анық көрінбейтін. Түстері мен opacity мәндері түзетілді.
- Мобильді Account белгішесінің мәтіні жасырылғанда accessible name жоғалатын. Аккаунт сілтемесінің атауы және көрінетін Profile/Sign in мәтіні сәйкестендірілді.
- Saved сүзгісінің accessible label-і көрінетін «Saved N» мәтінін қамтымайтын. Атауы түзетіліп, декоративті жүрек screen reader-ден жасырылды. Brand атауының DOM мәтіні де реттелді.
- Сырттан келген ұзын, бос орынсыз model name карточкадан асып кетуі мүмкін еді. Мәтін контейнер ішінде тасымалданады.

### Аккаунт, inquiries және validation

- Бюджеттің алдыңғы нұсқасында қате мән Next/Submit кезінде тексерілгенімен, теру кезінде әріп енгізуге болатын. Бұл UX кемшілігі кейінгі тексерісте анықталды: енді өріс тек бүтін KZT цифрларын қабылдайды, аралас мәтін/теріс сан paste арқылы бұрынғы соманы өзгерте алмайды. Қате бірден бетте көрсетіледі; browser restore, reset және тікелей DOM мәнін өзгерту де тексерілді. Chrome мен WebKit-те 13-тен қосымша сценарий, төрт ен мен екі режимдегі 16 layout күйі өтті. Осы түзетуден кейін онлайн сайтта да Chrome мен WebKit-те 13-тен сценарий өтті, күтпеген runtime қатесі жоқ. Қосымша функционалдық нұсқа: 682f8ce; кеңейтілген бастапқы аудит пен кейінгі budget тексерісі бөлек сақталған.

- Shortlist бұрын бүкіл браузерге ортақ болатын. Кірген пайдаланушы үшін сақтаудың кілті енді оның user ID-іне байланысты. Guest shortlist signup/login кезінде сол аккаунтқа бір рет ауысып, guest кілті тазартылады. Кейінгі басқа аккаунт оны мұраламайды.
- Guest inquiry-ді email сәйкес болғаны үшін аккаунтқа көрсету алынып тасталды. Email жазу оның иесі екеніңді дәлелдемейді. Profile тек сол user ID-імен жасалған дұрыс inquiry жазбаларын көрсетеді.
- Аккаунт басқа tab-та ауысса немесе logout жасалса, ашық inquiry ішіндегі бұрынғы контакт пен message жаңа аккаунтқа өтіп кетпеуі үшін draft күйі тазартылады. Submit және Back арқылы оралу кезінде де иесі қайта тексеріледі.
- localStorage ішіндегі account, password және inquiry объектілерінің түрі, өрістері мен ұзындықтары тексеріледі. Бұзылған жазба профиль ашуға немесе JavaScript қатесіне әкелмеуі керек.
- Email-де қос нүкте, қате domain, орынсыз нүкте және ұқсас қате пішімдер өткізіле беретін жағдайлар қатаң тексерілді. Телефонның digit саны ғана емес, енгізілген жолдың ұзындығы да шектеледі.
- Password hash есептелуі asynchronous. Сол уақытта аккаунт жойылса не өзгерсе, ескі нәтижемен session ашылмайды: сақтаудағы жазба қайта тексеріледі.
- Жаңа аккаунттарда random salt және PBKDF2-HMAC-SHA256 үшін 600 000 iteration қолданылады. Plaintext password сақталмайды. Бұрынғы 120 000 iteration жазбалары үйлесімділік үшін әлі оқылады; барлық ескі пароль автоматты жаңарды деп айтылмайды.
- Пароль өрістері мен Show/Hide күйі беттен кетерде тазартылады. Storage write сәтсіз болса, inquiry жалған success көрсетпейді және енгізілген мәліметті сақтап қалады.

### CSP және сыртқы дерек

- Барлық HTML бетке Content Security Policy және no-referrer қосылды. Script тек сол origin-нен, API байланысы тек сайттың өзінен және NHTSA доменінен рұқсат етіледі. Object, base, frame, worker және сыртқы form submission шектелген. Inline styles интерфейстің jQuery анимациялары мен progress үшін рұқсат етілген.
- Сыртқа ашылатын сілтемелерге `noopener noreferrer` берілді. Return URL тек белгілі жергілікті беттерге рұқсат етеді; басқа origin, script URL, traversal, жоқ бет және account redirect loop қабылданбайды.
- API-дегі бұзылған Unicode таңбасы `encodeURIComponent` ішінде URIError туғызып, loading күйін аяқтатпайтын. Жергілікті query құру `URLSearchParams` арқылы қауіпсіз өңделеді.
- Pending API сұрауы беттен кеткенде тоқтайды. Нақты BFCache restore-да бұрын тоқтаған сұрау қайта басталмайтын. `pageshow.persisted` кезінде lookup қайта іске қосылады; бұл нақты Back навигациясымен расталды.
- Пайдаланушы және API мәтіндері HTML ретінде орындалмай, text ретінде көрсетіледі. XSS үлгілері, кештің бүлінген/ескірген/болашақ/шамадан тыс нұсқалары және ескі response жаңа таңдаудан кеш келген жағдайлар тексерілді.

## 4. Нақты тест нәтижелері

Төмендегі сандар бірдей өлшем емес. Сценарий тобы, viewport күйі, қайта көрсетілген сурет және бірегей URL бөлек есептеледі; оларды қосып «осынша бөлек функция» деп санауға болмайды.

| Тексеру | Нәтиже |
| --- | --- |
| Root негізгі browser flow | 11 топ өтті: signup/login/profile/inquiry/search/theme/gallery/API/navigation; күтпеген console/runtime/CSP/HTTP қатесі жоқ. |
| Frontend interaction flow | 13 топ өтті: FAQ/rating, copy success/failure, categories/sort/suggestions, барлық gallery controls, touch, theme, shortlist және account ауысуы. |
| Chromium layout | 126 күй: 7 бет × 9 ен × 2 режим. Ендері: 320, 375, 390, 600, 700, 701, 768, 1024, 1440 px. Signup тағы осы 9 енде екі режимде бөлек қаралды. |
| Суреттер мен атаулар | Осы қайталанған күйлерде 738 жүктелген image instance және 3 232 аты бар visible control instance тексерілді. Бұл 738 бөлек фото немесе 3 232 бөлек батырма деген сөз емес. |
| Overlap/covered controls | 980 interactive centre тексерілді. Кеңейтілген FAQ, invalid signup/profile/preferences, inquiry review және confirmation күйлерінде жабылып қалған control табылмады. |
| Қосымша reflow | 720 CSS px және 2x density күйі өтті. Бұл нақты барлық құрылғыда browser zoom тексерілді деген сертификат емес. |
| Account/security regressions | 16 тексеру өтті: жеке дерек байланысы, бұзылған storage, unsafe redirect, async login, password cleanup, CSP және storage failure. Күтпеген runtime қатесі жоқ. |
| Email/phone regressions | 8 қате email үлгісі signup/login/inquiry ішінде қабылданбады: 24 UI rejection. Дұрыс 5 үлгі және plus-tag мысалы қаралды; шамадан тыс phone spacing қабылданбайды. |
| API deterministic tests | Түзетулерден кейін 20 сценарийдің бәрі өтті. Frontend layout-та API fixture қолданылды; ол нақты API нәтижесі ретінде есептелмейді. |
| Нақты API | UI-дегі 8 make үшін HTTP 200 және CORS allow-origin `*` алынды. Нақты Back навигациясы тоқтаған сұрауды қайта бастап, нәтиже көрсетті. |
| axe-core | Соңғы 52 күйде 0 анықталған violation және 0 құрал қатесі. Кейбір тексерулер manual review сұрай алады; бұл толық WCAG сертификаты емес. |
| WebKit smoke | 7 топ өтті; 42 public page/width/theme күйі, signup/WebCrypto/profile/inquiry/search/live API/logout қамтылды. Бұл физикалық iPhone немесе барлық Safari нұсқалары тексерілді деген сөз емес. |
| Статикалық HTML | 8 бет, 5 novalidate form, 296 reference instance, оның ішінде 283 local reference instance. Жоғалған target, duplicate ID және бұзылған ARIA reference саны 0. |
| Навигация және суреттер | Frontend suite-та 38 unique local URL өтті; соңғы толық screenshot/navigation capture 44 unique URL-ді ашты. Query URL жиындары әртүрлі болғандықтан сандар бөлек. Capture кезінде барлық сурет жүктелген. |
| Сыртқы сілтемелер | Көрінетін үш сыртқы сілтеме: Wikimedia source, CC BY-SA 4.0 licence және NHTSA documentation. Үшеуі де HTTP 200 қайтарды. |
| Vendor және құпия дерек сканы | Жергілікті jQuery 4.0.0 файлы line ending қалыпқа келтірілгеннен кейін ресми code.jquery.com файлымен сәйкес. Тапсырылатын source ішінде .env/private key файлдары және тексерілген private key/AWS/GitHub token үлгілері табылмады. |

Жұмыс жазбалары: `tmp/final-audit/frontend/result.json`, `frontend/layout-result.json`, `security/verification.json`, `security/email-verification.json`, `api/api-final.json`, `api/bfcache-native-fixed.json`, `core-local/verification.json` және `accessibility/results.json`. Аудитте қасақана жіберілген CSP шабуылдары бөлек есептеледі: олардан туған күтілетін violation қалыпты сайттағы қате ретінде саналмайды. Шабуыл сұраулары сыртқа жіберілмей тоқтатылған.

About бетіндегі команда рөлдері бекітілген report бөлінісімен сәйкестендірілді: Muhammad - дизайн, Arsen - accounts/forms, Farabi - data/search/API, Kuttibay - content/testing. FAQ мен inquiry confirmation енді тек аккаунтқа кіріп жасаған inquiries сол профильде көрінетінін дұрыс түсіндіреді.

## 5. Қауіпсіздіктің қалған шекаралары

Тапсырма backend қолданбай, localStorage арқылы authentication simulation жасауды талап етеді. Осы талап сақталды. Аккаунтқа бөлек кілт беру қалыпты интерфейс ағынында деректердің араласып кетуін түзетеді, бірақ браузер сақтауын серверлік access control-ға айналдырмайды.

- Браузер профиліне немесе DevTools-қа қолы жеткен адам localStorage ішіндегі account/session дерегін оқып, өзгерте алады. Demo session-ды нақты сервер тексермейді.
- localStorage origin бойынша ортақ; URL path жеке қауіпсіздік шекарасы емес. Бір `vertex-blip.github.io` origin-дегі басқа беттердің JavaScript коды да сол сақтауға қол жеткізе алады. Бұл шектеу [OWASP HTML5 Security](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html) нұсқаулығында түсіндірілген.
- Hash plaintext пароль сақтаудан жақсы, бірақ браузердегі hash-ті алу мүмкіндігін немесе offline password guessing-ті жоймайды. Demo үшін басқа жерде қолданылмайтын пароль және үлгі деректер қолдану керек. Production нұсқада account/session тексеруі мен құқықтарды басқару серверде орындалуы тиіс.
- Email/phone validation олардың пішімін тексереді. Нақты email немесе телефон иесін растау үшін серверлік verification қажет; бұл жобада ондай қызмет жоқ.
- HTML meta CSP script/resource шектеулерін береді, бірақ `frame-ancestors` meta ішінде жұмыс істемейді. Басқа сайттың осы бетті iframe-ге салуына серверлік CSP header керек. `frame-src 'none'` осы сайттың өз iframe жүктеуін шектейді; ол сол шектеудің орнына жүрмейді. [MDN frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors).
- API және hosting сыртқы қызметтер. Олар кейін қолжетімсіз болуы мүмкін; timeout, retry және анық белгіленген cache fallback соған арналған. Бағалар үлгі дерек, inquiry нақты email жібермейді және test drive брондамайды.

Тексерілген сценарийлерде қалған ақау табылмауы «100% қауіпсіз» немесе барлық болашақ жағдайда қатесіз жұмыс істейді деген кепілдік емес.

## 6. Соңғы жарияланған нұсқа

- Түзетілген функционалдық нұсқа GitHub Pages-ке жарияланды: **орындалды**, commit `bcffcca`. [Сәтті deployment](https://github.com/Vertex-blip/Car-dealership-website/actions/runs/43822665241).
- Осы нұсқадағы онлайн тексеру: **11 негізгі топ және 16 қауіпсіздік тобы өтті**. Күтпеген JavaScript/console/CSP қатесі және сәтсіз жергілікті ресурс сұрауы жоқ; әдейі жасалған CSP шабуылдары бөлек есептелді.
- Submission жинағы: **CRC және файл hash сәйкестігі тексерілді**. Сыртқы ZIP ішінде дәл үш файл бар: project ZIP, 5 беттік PDF және links TXT. Project ZIP ішіндегі 64 файл бастапқы папкамен салыстырылды; PDF-тегі 7 сурет түсті, үш сілтеме басылады.

Жарияланған сайттың барлық 48 application файлы HTTP 200 қайтарды және жергілікті файлдармен салыстырғанда сәйкес келді (мәтіннің жол соңы қалыпқа келтірілді). Жергілікті және жарияланған нұсқалар бөлек тексерілді. Толық жазбалардың көшірмесі `docs/audit-evidence.json` ішінде; қысқаша нәтиже `docs/verification-summary.json` ішінде сақталған. Репетиция, қорғау және Moodle upload осы техникалық тексерудің орындалған қадамдары ретінде белгіленбейді.

## 7. Тапсыру форматы және команда жасайтын қадамдар

Оқытушы скриншотта мақұлдаған формат бойынша Moodle-ға **бір сыртқы ZIP** жүктеледі:

```text
ApexMotors_SE2507_Submission.zip
  ApexMotors_SE2507_FinalProject.zip
  ApexMotors_SE2507_Report.pdf
  ApexMotors_SE2507_Links.txt
```

Project ZIP ішінде HTML/CSS/JS, суреттер және қажет файлдар сақталады. PDF есептің қарпі мен құрылымы қарапайым, ал фотолар түпнұсқа түстерінде болады. TXT ішінде repository, final source folder және live website сілтемелері бар. Бір сыртқы ZIP форматы әр студенттің жеке submission жасау талабын өзгертпейді.

Әр студент архивті өз Moodle аккаунтынан FINAL EXAM папкасына тапсырады. Қорғау алдында төрт адам 4:30-5:00 аралығына репетиция жасап, рөлдерін және резервтік скриншоттарды дайындайды. Нақты Moodle upload, репетиция және презентация өткізілді деп бұл аудитте белгіленген жоқ.

Live сайт: [Apex Motors](https://vertex-blip.github.io/Car-dealership-website/final-project/). Код: [GitHub final-project](https://github.com/Vertex-blip/Car-dealership-website/tree/main/final-project).

## 8. Қолданылған ресми анықтамалар

- [NHTSA vPIC API](https://vpic.nhtsa.dot.gov/api/): make/model/year endpoint және traffic control туралы анықтама.
- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html): жобада қолданылған PBKDF2-HMAC-SHA256 үшін 600 000 iteration жөніндегі нұсқаулық. Бұл localStorage демосын production authentication ретінде растау емес.
- [OWASP HTML5 Security](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html): localStorage, session және same-origin шекаралары.
- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP) және [frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors): CSP не шектейтіні және meta policy шектеуі.
- [Ресми jQuery 4.0.0 файлы](https://code.jquery.com/jquery-4.0.0.min.js): жергілікті vendor файлын салыстыру көзі.


## 9. Endterm функцияларын қалпына келтіру

Endterm-дегі Appearance панелі барлық сегіз бетке қайтарылды. Түсті таңдау, кездейсоқ реңк, фонды бастапқы қалпына келтіру және light/dark режимі жұмыс істейді. Таңдау бет ауыстырғанда, қайта жүктегенде, басқа қойындыда және Back арқылы қайтқанда сақталады. Панель Close, Escape, сыртқа басу немесе фокусты шығарумен жабылады; мобильді мәзірмен қатар ашылмайды.

Сол/оң бағыттауыш пернелері негізгі мәзірдегі фокусты айналдырады; Enter таңдалған бетті ашады. Мәтін өрістері, select, түс таңдағышы, Account қойындылары мен Showroom галереясы өз пернелерін сақтайды. Сақталған реңк CSS-ке қойылмас бұрын сан ретінде тексеріледі. Storage жабық болса, баптау осы бетте жұмыс істеп, сақталмағаны көрсетіледі.

- Жергілікті Chrome және WebKit: 26 функционалдық топ, 192 ашық панель layout күйі; қосымша 24 қысқа/тар viewport күйі өтті. Екі Close/палитра батырмасы тексерісі де өтті.
- Реңк пен режимнің 12 үлгісі тексерілді: бәсең мәтін контрасты кемінде 5.06:1, негізгі батырма мәтіні кемінде 4.97:1.
- Жарияланған сайт: 26 функционалдық топ, 8 өкілдік layout күйі және 11 негізгі сайт тобы өтті. 48 application файлы HTTP 200 қайтарып, жергілікті нұсқамен сәйкес келді.
- Тексерістерде күтпеген runtime/CSP/HTTP қатесі жоқ. Бұл Windows-тағы автоматтандырылған браузер тексеруі; нақты iPhone/Safari сертификаты емес.
- Функционалдық commit: `21531e2`. [Сәтті deployment](https://github.com/Vertex-blip/Car-dealership-website/actions/runs/43895126548). Репорт скриншоттары жаңартылды; PDF бұрынғыдай 5 бет, датасыз, түсті фотолар және үш басылатын сілтеме.
