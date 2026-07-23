import re

# 1. Update App.tsx
app_content = open('src/App.tsx').read()

new_full_instruction = (
    "دستور اکید و لایه‌به‌لایه ۱۰۰٪ جامع (موتور ارشد Gemini): "
    "تمام اطلاعات مندرج در این سند مالی و اداری را بدون هیچ‌گونه استثنا، حذف، خلاصه‌سازی یا نادیده گرفتن، ۱۰۰٪ کامل و با دقت مطلق استخراج کن. "
    "تأکید اکید می‌شود که کلیه اجزای سند باید تبدیل به داده شوند: "
    "۱) تمامی مشخصات هدر (شامل نام کامل صادرکننده و خریدار، شناسه/کد ملی، کد اقتصادی، شماره ثبت، شماره فاکتور/سند/پیگیری/صیادی، تاریخ‌های شمسی و میلادی، آدرس‌ها، تلفن‌ها و ایمیل)؛ "
    "۲) تک‌تک سطرهای جدول اقلام (شامل شماره ردیف، کد کالا، شرح کامل و دقیق کالا/خدمات، تعداد/مقدار، واحد سنجش، قیمت واحد/فی، مبلغ کل، تخفیف سطر، ارزش افزوده سطر و مبلغ نهایی ردیف)؛ "
    "۳) تمام محاسبات و اعداد فوتر (شامل جمع کل قبل از تخفیف، تخفیف کل، مبلغ مشمول مالیات، نرخ و مبلغ مالیات بر ارزش افزوده و عوارض، سایر کسورات/اضافات، مبلغ قابل پرداخت حروفی و عددی، و شماره حساب/شبا/کارت بانکی)؛ "
    "۴) کلیه متون، یادداشت‌ها، شروط فاکتور، وضعیت مهر و امضاها. "
    "خروجی باید منحصراً یک ساختار JSON کاملاً شفاف با کلیدهای استاندارد فارسی باشد تا بدون نیاز به ویرایش دستی، مستقیماً وارد جدول و فایل اکسل شود."
)

# Replace old fullJsonInstruction definition in handleExtract100PercentAllToJsonAndExcel
app_content = re.sub(
    r'const fullJsonInstruction = "[^"]+";',
    f'const fullJsonInstruction = "{new_full_instruction}";',
    app_content,
    count=1
)

# Replace the text in the Hero Action Card in App.tsx
old_hero_title = "<span>دستور ویژه: تبدیل ۱۰۰٪ کلیه اطلاعات (اعداد و متون) به JSON جهت اکسل مستقیم</span>"
new_hero_title = "<span>⚡ دستور ویژه: استخراج ۱۰۰٪ کلیه اطلاعات (اعداد، متون، هدر، اقلام و فوتر) به JSON جهت اکسل مستقیم</span>"

app_content = app_content.replace(old_hero_title, new_hero_title)

# Replace hero card description
old_hero_desc_pat = r'«دستور اکید و تضمینی ویژه \(Gemini 3\.6 Flash\):[^»]+»'
new_hero_desc = (
    "«دستور اکید و لایه‌به‌لایه ۱۰۰٪ جامع: تمام اطلاعات مندرج در این سند (شامل مشخصات کامل صادرکننده/خریدار، شناسه ملی، کد اقتصادی، شماره سند، تاریخ‌ها، تک‌تک سطرهای جدول اقلام، کالاها، مقادیر، فی، تخفیفات، مالیات بر ارزش افزوده، عوارض، جمع کل، شماره شبا/حساب و تمامی یادداشت‌های حاشیه‌ای) را بدون کوچک‌ترین استثنا به JSON تبدیل کن تا مستقیماً وارد فایل اکسل شود.»"
)
app_content = re.sub(old_hero_desc_pat, new_hero_desc, app_content)

# Update chip query in App.tsx
app_content = app_content.replace(
    'query: "دستور اکید و تضمینی ویژه (Gemini 3.6 Flash): تمام اطلاعات مندرج در این سند را بدون استثنا و ۱۰۰٪ کامل استخراج کن. هر آنچه می‌بینی، از ریزترین اعداد، تاریخ‌ها، کدهای اقتصادی، شناسه ملی، مبالغ جزئی، مالیات، عوارض، تا توضیحات متنی طولانی و آدرس‌ها را به فرمت JSON تبدیل کن. خروجی باید مطلقاً و منحصراً یک آرایه JSON ساختاریافته (بدون تگ مارک‌داون ```json، بدون هیچ کلمه اضافه یا توضیح) باشد. تک‌تک سطرها و اقلام باید با کلیدهای فارسی کاملاً شفاف و استاندارد تولید شوند تا بدون نیاز به حتی یک ثانیه ویرایش، مستقیماً سطر به سطر وارد جدول اکسل شوند. تضمین ۱۰۰ درصدی دقت ریاضی مبالغ و یکپارچگی داده‌ها الزامی است."',
    f'query: "{new_full_instruction}"'
)

open('src/App.tsx', 'w').write(app_content)
print("Updated App.tsx successfully")

# 2. Update DocumentExclusiveChatModal.tsx
modal_content = open('src/components/DocumentExclusiveChatModal.tsx').read()
modal_content = modal_content.replace(
    'handleSendMessage("دستور اکید و تضمینی ویژه (Gemini 3.6 Flash): تمام اطلاعات مندرج در این سند را بدون استثنا و ۱۰۰٪ کامل استخراج کن. هر آنچه می‌بینی، از ریزترین اعداد، تاریخ‌ها، کدهای اقتصادی، شناسه ملی، مبالغ جزئی، مالیات، عوارض، تا توضیحات متنی طولانی و آدرس‌ها را به فرمت JSON تبدیل کن. خروجی باید مطلقاً و منحصراً یک آرایه JSON ساختاریافته (بدون تگ مارک‌داون ```json، بدون هیچ کلمه اضافه یا توضیح) باشد. تک‌تک سطرها و اقلام باید با کلیدهای فارسی کاملاً شفاف و استاندارد تولید شوند تا بدون نیاز به حتی یک ثانیه ویرایش، مستقیماً سطر به سطر وارد جدول اکسل شوند. تضمین ۱۰۰ درصدی دقت ریاضی مبالغ و یکپارچگی داده‌ها الزامی است.");',
    f'handleSendMessage("{new_full_instruction}");'
)
open('src/components/DocumentExclusiveChatModal.tsx', 'w').write(modal_content)
print("Updated DocumentExclusiveChatModal.tsx successfully")

# 3. Update server.ts
server_content = open('server.ts').read()

# Enhance promptText logic in server.ts
old_user_prompt_block = '''    if (userPrompt && typeof userPrompt === "string" && userPrompt.trim()) {
      promptText += `\\n\\n[دستور اختصاصی حسابدار / کاربر برای استخراج]:\\n${userPrompt}\\nلطفا توجه ویژه‌ای به این دستور کاربر داشته باشید و ترجیحاً استخراج و تحلیل را بر مبنای این درخواست انجام دهید.`;
    }'''

new_user_prompt_block = '''    if (userPrompt && typeof userPrompt === "string" && userPrompt.trim()) {
      promptText += `\\n\\n[دستور اختصاصی حسابدار / کاربر برای استخراج]:\\n${userPrompt}\\nلطفا توجه ویژه‌ای به این دستور کاربر داشته باشید و ترجیحاً استخراج و تحلیل را بر مبنای این درخواست انجام دهید.`;
      if (userPrompt.includes("۱۰۰٪") || userPrompt.includes("دستور اکید") || userPrompt.includes("تمام اطلاعات")) {
        promptText += `\\n\\n🚨 [دستور ویژه استخراج ۱۰۰٪ جامع و بدون استثنا]: کاربر رسماً تاکید کرده است که کلیه اعداد، متون، جداول، کدهای اقتصادی، شناسه‌های ملی، آدرس‌ها، تلفن‌ها، تک‌تک سطرهای فاکتور، شرح کالاها، مقادیر، قیمت‌های واحد، تخفیفات، مالیات بر ارزش افزوده، عوارض، جمع کل، شماره شبا/حساب و تمامی یادداشت‌ها و شروط حاشیه‌ای سند بدون کوچک‌ترین حذف یا خلاصه‌سازی استخراج شوند. عدم استخراج حتی یک سطر یا یک فیلد خطای حیاتی محسوب می‌شود.`;
      }
    }'''

server_content = server_content.replace(old_user_prompt_block, new_user_prompt_block)

open('server.ts', 'w').write(server_content)
print("Updated server.ts successfully")
