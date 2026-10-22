# មគ្គុទ្ទេសក៍ការដាក់ឱ្យដំណើរការប្រព័ន្ធឡើង Cloud (Production Deployment Guide 2026)
## មន្ទីរសម្រាកព្យាបាល ហួន វណ្ណៈ (Houn Vannak Medical Clinic & Polyclinic)

---

### សេចក្តីសង្ខេបស្ថាបត្យកម្មប្រព័ន្ធ (Architecture Overview)

ប្រព័ន្ធត្រូវបានរៀបចំឡើងជាលក្ខណៈ Modern Decoupled Cloud Architecture ដែលមានស្ថេរភាពខ្ពស់ និងល្បឿនលឿនបំផុតសម្រាប់អ្នកប្រើប្រាស់នៅប្រទេសកម្ពុជា:

1. **Frontend:** Vercel (Next.js Edge Network & SSR)
2. **Backend API:** Render Web Service (NestJS REST API, Node.js Runtime, Singapore Region)
3. **Database:** Neon Serverless PostgreSQL (Singapore Region `ap-southeast-1` ជាមួយ Connection Pooling)
4. **Image & File Storage:** Cloudinary CDN (ផ្ទុក និងបង្ហាប់រូបភាពកាតអ្នកជំងឺ វិក្កយបត្រ ឡូហ្គោ និងឯកសារវេជ្ជសាស្ត្រស្វ័យប្រវត្ត)
5. **Real-time Notifications:** Telegram Supergroup Alert Bot (@Clinic_systemBot)
6. **Payment Gateway:** ABA PayWay & Bakong KHQR Dynamic Engine

---

### ជំហានទី ១: រៀបចំមូលដ្ឋានទិន្នន័យ Neon PostgreSQL (Database Setup)

1. ចូលទៅកាន់គេហទំព័រ [https://neon.tech](https://neon.tech) ហើយចុះឈ្មោះ ឬ Login ដោយប្រើ GitHub / Google Account។
2. ចុច **Create Project**:
   - Project name: `houn-vannak-clinic`
   - Postgres version: `16` (ឬចុងក្រោយបំផុត)
   - Region: ជ្រើសរើស **AWS Asia Pacific (Singapore) `ap-southeast-1`** (ដើម្បីកាត់បន្ថយ Latency មកកម្ពុជាឱ្យនៅសល់ត្រឹម ~25-35ms)។
3. នៅពេលបង្កើតរួច Neon នឹងបង្ហាញ Connection Details:
   - ចុចយក **Pooled connection** ហើយចម្លង Connection String:
     `postgresql://[user]:[password]@[endpoint]-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
     *(នេះជា `DATABASE_URL`)*
   - ដោះធីក Connection pooling ដើម្បីយក **Direct connection**:
     `postgresql://[user]:[password]@[endpoint].ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
     *(នេះជា `DIRECT_URL`)*
4. បង្កើតតារាងទិន្នន័យ (Database Schema Migration) ពីម៉ាស៊ីន Local ទៅកាន់ Neon:
   - បើក Terminal ក្នុងថត `backend`
   - ដំណើរការ Command:
     ```bash
     $env:DATABASE_URL="<your_neon_pooled_connection_url>"
     $env:DIRECT_URL="<your_neon_direct_connection_url>"
     npx prisma db push
     npm run prisma:seed
     ```
   - ទិន្នន័យតារាង និងគណនីដំបូង (Super Admin: `owner@clinic.com` / `Rotana#Owner$2026!MasterKey`) នឹងត្រូវបានបញ្ចូលទៅក្នុង Neon ដោយស្វ័យប្រវត្ត។

---

### ជំហានទី ២: រៀបចំគណនី Cloudinary (Cloud Image & Document Storage)

1. ចូលទៅកាន់គេហទំព័រ [https://cloudinary.com](https://cloudinary.com) ហើយចុះឈ្មោះគណនីឥតគិតថ្លៃ (Free Tier ផ្តល់ទំហំរហូតដល់ 25GB)។
2. ចូលទៅកាន់ **Dashboard** (Settings -> Access Keys) ហើយចម្លងព័ត៌មានទាំង ៣ នេះ:
   - `Cloud name`: ឧទាហរណ៍ `dr-houn-vannak`
   - `API Key`: ឧទាហរណ៍ `123456789012345`
   - `API Secret`: ឧទាហរណ៍ `abcdefghijklmnopqrstuvwx`
3. រាល់ពេលដែលបុគ្គលិក Upload រូបភាពកាតអ្នកជំងឺ ឡូហ្គោគ្លីនិក ឬលទ្ធផលពិនិត្យឈាម ប្រព័ន្ធនឹងបញ្ជូនទៅ Cloudinary ដោយផ្ទាល់ ហើយរក្សាទុកតែ HTTPS CDN URL នៅក្នុង Neon PostgreSQL ប៉ុណ្ណោះ (ជួយសន្សំទំហំ Database មិនឱ្យឡើងទំហំធំ)។

---

### ជំហានទី ៣: ដាក់ឱ្យដំណើរការ Backend នៅលើ Render (Render Web Service)

1. Push កូដគម្រោងទាំងមូលទៅកាន់ Git Repository របស់អ្នក (GitHub ឬ GitLab)។
2. ចូលទៅកាន់គេហទំព័រ [https://render.com](https://render.com)។
3. ចុច **New +** -> ជ្រើសរើស **Web Service**:
   - ភ្ជាប់ជាមួយ GitHub Repository នៃគម្រោងនេះ
   - Name: `clinic-systems-backend`
   - Region: ជ្រើសរើស **Singapore (Southeast Asia)**
   - Branch: `main` (ឬ `master`)
   - Root Directory: `backend`
   - Runtime: `Node`
   - Build Command: `npm install && npm run prisma:generate && npm run build`
   - Start Command: `npm run start:prod`
   - Plan Type: `Starter` (ឬ Free)
4. នៅផ្នែក **Advanced** -> **Health Check Path**:
   - បញ្ចូល: `/api/health`
5. នៅផ្នែក **Environment Variables** (បន្ថែមតម្លៃខាងក្រោម):
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `DATABASE_URL`: `<Neon Pooled Connection String>`
   - `DIRECT_URL`: `<Neon Direct Connection String>`
   - `JWT_SECRET`: `<កូដសម្ងាត់ 64 តួអក្សរសម្រាប់សុវត្ថិភាព>`
   - `JWT_EXPIRES_IN`: `7d`
   - `BAKONG_ACCOUNT_ID`: `rotana_clinic@aba`
   - `BAKONG_MERCHANT_NAME`: `Houn Vannak Medical Clinic`
   - `BAKONG_MERCHANT_CITY`: `Phnom Penh`
   - `BAKONG_CURRENCY`: `USD`
   - `CLOUDINARY_CLOUD_NAME`: `<Cloudinary Cloud Name>`
   - `CLOUDINARY_API_KEY`: `<Cloudinary API Key>`
   - `CLOUDINARY_API_SECRET`: `<Cloudinary API Secret>`
   - `TELEGRAM_BOT_TOKEN`: `8822219627:AAHjLV4FeVD5XS55BpUil24UgLdR3WsiUsg`
   - `TELEGRAM_CHAT_ID`: `-1004328379441`
   - `TELEGRAM_TOPIC_PAYMENTS`: `57`
   - `TELEGRAM_TOPIC_QUEUE`: `69`
   - `TELEGRAM_TOPIC_PHARMACY`: `59`
   - `TELEGRAM_TOPIC_SECURITY`: `60`
   - `FRONTEND_URL`: `https://houn-vannak-clinic.vercel.app` *(ឬ URL Vercel របស់អ្នក)*
6. ចុច **Create Web Service** ហើយរង់ចាំ Render Build រហូតចេញស្ថានភាព `Live`។
7. ចម្លងអាសយដ្ឋាន URL របស់ Render Backend ឧទាហរណ៍: `https://clinic-systems.onrender.com`។

---

### ជំហានទី ៤: ដាក់ឱ្យដំណើរការ Frontend នៅលើ Vercel (Vercel Next.js)

1. ចូលទៅកាន់គេហទំព័រ [https://vercel.com](https://vercel.com)។
2. ចុច **Add New...** -> ជ្រើសរើស **Project**។
3. Import GitHub Repository នៃគម្រោងនេះ។
4. នៅទំព័រ Configure Project:
   - Project Name: `clinic-systems`
   - Framework Preset: `Next.js`
   - Root Directory: ចុច Edit ហើយជ្រើសរើសថត `frontend`
5. នៅផ្នែក **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: `https://clinic-systems.onrender.com/api`
     *(ដាក់ Backend Render URL របស់អ្នកដោយមានកន្ទុយ `/api`)*
6. ចុច **Deploy**:
   - Vercel នឹងធ្វើការ Build Next.js ស្វ័យប្រវត្តក្នុងរយៈពេលប្រហែល ១ ទៅ ២ នាទី។
   - នៅពេលជោគជ័យ Vercel នឹងផ្តល់ Domain ផ្លូវការ (ឧទាហរណ៍: `https://houn-vannak-clinic.vercel.app`)។
7. ត្រឡប់ទៅ Render Backend Dashboard វិញ ហើយពិនិត្យមើលថា Environment Variable `FRONTEND_URL` បានកំណត់ទៅ Domain ថ្មីរបស់ Vercel នោះហើយឬនៅ ដើម្បីឱ្យ CORS ដំណើរការរលូន។

---

### ជំហានទី ៥: រៀបចំ Cloudflare (Custom Domain, DNS, SSL & DDoS Protection)

Cloudflare ដើរតួជាខែលការពារសុវត្ថិភាព (Firewall), គ្រប់គ្រង DNS និងផ្តល់ SSL Encryption កម្រិតខ្ពស់សម្រាប់ Custom Domain របស់គ្លីនិក:

1. **បង្កើតគណនី និងបន្ថែម Domain ទៅក្នុង Cloudflare:**
   - ចូលទៅកាន់គេហទំព័រ [https://cloudflare.com](https://cloudflare.com) ហើយចុះឈ្មោះគណនីឥតគិតថ្លៃ។
   - ចុច **Add a site** -> បញ្ចូលឈ្មោះ Domain របស់គ្លីនិក (ឧទាហរណ៍: `hounvannak-clinic.com`)។
   - ជ្រើសរើស **Free Plan** ($0/ខែ) ហើយចុច Continue។
   - Cloudflare នឹងផ្តល់ Nameservers ចំនួន ២ (ឧទាហរណ៍: `amy.ns.cloudflare.com` និង `bob.ns.cloudflare.com`)។

2. **ប្តូរ Nameservers នៅ Registrar (កន្លែងដែលទិញ Domain):**
   - ចូលទៅកាន់កន្លែងដែលអ្នកបានទិញ Domain (Namecheap, GoDaddy, Google Domains, etc.)។
   - ចូលទៅកាន់ផ្នែក Manage Domain -> DNS / Nameservers។
   - ប្តូរពី Default Nameservers ទៅជា **Custom Nameservers** របស់ Cloudflare ទាំង ២ នោះ។
   - រង់ចាំប្រហែល ៥ ទៅ ១៥ នាទីរហូតដល់ Cloudflare បញ្ជាក់ស្ថានភាព Active។

3. **កំណត់ DNS Records សម្រាប់ Frontend (Vercel):**
   - ចូលទៅកាន់ផ្ទាំង **DNS** -> **Records** ក្នុង Cloudflare:
     - Record ទី ១:
       - Type: `CNAME`
       - Name: `@` (Root Domain)
       - Target: `cname.vercel-dns.com`
       - Proxy status: `Proxied` (បើកពពកពណ៌ទឹកក្រូច)
     - Record ទី ២:
       - Type: `CNAME`
       - Name: `www`
       - Target: `cname.vercel-dns.com`
       - Proxy status: `Proxied` (បើកពពកពណ៌ទឹកក្រូច)
   - ក្នុង Vercel Dashboard: ចូលទៅកាន់ Settings -> Domains -> បន្ថែម `hounvannak-clinic.com` និង `www.hounvannak-clinic.com`។

4. **កំណត់ DNS Record សម្រាប់ Backend (Render API Custom Subdomain):**
   - ក្នុង Cloudflare DNS Records បន្ថែម:
     - Type: `CNAME`
     - Name: `api`
     - Target: `clinic-systems.onrender.com` - ឈ្មោះ Render backend របស់អ្នក
     - Proxy status: `Proxied` (បើកពពកពណ៌ទឹកក្រូច)
   - ក្នុង Render Dashboard: ចូលទៅកាន់ Settings -> Custom Domains -> បន្ថែម `api.hounvannak-clinic.com`។
   - ធ្វើបច្ចុប្បន្នភាព Environment Variable ក្នុង Vercel:
     `NEXT_PUBLIC_API_URL=https://api.hounvannak-clinic.com/api`

5. **កំណត់ SSL/TLS Encryption & Security:**
   - ចូលទៅកាន់ផ្ទាំង **SSL/TLS**:
     - ជ្រើសរើសទម្រង់: **Full (strict)** (ដើម្បីឱ្យមានសុវត្ថិភាពខ្ពស់បំផុតរវាង Cloudflare និង Render/Vercel)។
   - ចូលទៅកាន់ **Edge Certificates**:
     - បើកមុខងារ: **Always Use HTTPS** -> `ON`
     - បើកមុខងារ: **Automatic HTTPS Rewrites** -> `ON`
     - Minimum TLS Version: `TLS 1.2`
   - ចូលទៅកាន់ **Security** -> **Bots**:
     - បើក **Bot Fight Mode** -> `ON` (ដើម្បីការពារប្រព័ន្ធពីការរំខានដោយស្វ័យប្រវត្តិ និងចរាចរណ៍ក្លែងក្លាយ)។

---

### ជំហានទី ៦: ការធ្វើតេស្តផ្ទៀងផ្ទាត់ប្រព័ន្ធពេញលេញ (Production Verification Checklist)

1. **ការចូលប្រើប្រាស់ (Authentication):**
   - ចូលទៅកាន់ Domain ផ្លូវការ (ឧ. `https://hounvannak-clinic.com`) ហើយ Login ដោយប្រើ `owner@clinic.com` / `Rotana#Owner$2026!MasterKey`។
2. **ការ Upload រូបភាព និងឯកសារ (Cloudinary CDN Test):**
   - ចូលទៅកាន់ទំព័រ Medical Documents ឬ Invoice Template Designer។
   - សាកល្បង Upload ឡូហ្គោគ្លីនិក ឬឯកសារពិនិត្យឈាម។
   - ពិនិត្យមើលថា URL ឯកសារដែលរក្សាទុកមានទម្រង់ `https://res.cloudinary.com/...`។
3. **ការបង្កើតវិក្កយបត្រ និងទូទាត់ KHQR (Payment Test):**
   - បង្កើតវិក្កយបត្រថ្មី ហើយចុច Pay with KHQR។
   - ពិនិត្យមើលថាតើ QR Code បង្ហាញត្រឹមត្រូវ និងអាចស្កេនបានជាមួយ ABA Mobile App ឬ Bakong App។
4. **ការជូនដំណឹងតាម Telegram (Telegram Bot Alerts):**
   - ពិនិត្យមើល Telegram Supergroup (`-1004328379441`)។
   - ការជូនដំណឹងត្រូវបញ្ជូនចូលទៅកាន់ Topic ត្រឹមត្រូវ (Payments, Queue, Pharmacy, Security) ដោយគ្មាន Duplicate។
5. **សុវត្ថិភាព Cloudflare SSL & Fast DNS:**
   - ពិនិត្យមើលរូបសោរ SSL (Padlock) លើ Browser ឃើញពណ៌បៃតង/សុវត្ថិភាព (HTTPS 100%)។


