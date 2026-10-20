'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Printer,
  Send,
  QrCode,
  Stethoscope,
  Search,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  PhoneCall,
  ExternalLink,
  ShieldCheck,
  Zap,
  Terminal,
  Settings,
  Copy,
  Check,
} from 'lucide-react';
import { useTranslation } from '../../context/I18nContext';
import { PublicNavbar } from '../../components/landing/PublicNavbar';
import { PublicFooter } from '../../components/landing/PublicFooter';

interface GuideStep {
  step: string;
  title: string;
  desc: string;
  code?: string;
  tip?: string;
}

interface GuideItem {
  id: string;
  category: 'printer' | 'telegram' | 'khqr' | 'workflow';
  titleKh: string;
  titleEn: string;
  summaryKh: string;
  summaryEn: string;
  stepsKh: GuideStep[];
  stepsEn: GuideStep[];
  troubleshootingKh?: string[];
  troubleshootingEn?: string[];
}

const GUIDES: GuideItem[] = [
  {
    id: 'printer-setup',
    category: 'printer',
    titleKh: 'ការតភ្ជាប់ម៉ាស៊ីនព្រីនកម្ដៅ 80mm ESC/POS និងកេះថតប្រាក់',
    titleEn: '80mm ESC/POS Thermal Receipt Printer & Cash Drawer Setup',
    summaryKh: 'ការណែនាំលម្អិតអំពីការតភ្ជាប់ខ្សែ USB ឬ Network IP, ការដំឡើង Raw Driver, និងការកំណត់បញ្ជាបើកកេះថតប្រាក់ RJ11 ស្វ័យប្រវត្ត។',
    summaryEn: 'Step-by-step instructions for connecting USB or Ethernet network thermal printers, configuring raw print modes, and RJ11 auto-drawer kick.',
    stepsKh: [
      {
        step: '01',
        title: 'តភ្ជាប់ខ្សែរឹង (Hardware Connection)',
        desc: 'ដោតខ្សែ USB ប្រភេទ Type-B ពីម៉ាស៊ីនព្រីនចូលកុំព្យូទ័របេឡា ឬដោតខ្សែបណ្ដាញ Ethernet RJ45 ចូល Switch/Router ប្រចាំគ្លីនិក។ ពិនិត្យមើលភ្លើង Power LED ពណ៌ខៀវត្រូវភ្លឺថេរ។',
      },
      {
        step: '02',
        title: 'ដំឡើង Driver និងកំណត់ទំហំក្រដាស 80mm',
        desc: 'ទាញយក Driver ម៉ាស៊ីនព្រីនម៉ូដែលរបស់អ្នក (ឧ. Xprinter, Epson TM-T82, Rongta)។ នៅក្នុង Control Panel -> Devices and Printers សូមជ្រើសរើស Paper Size: 80mm x Receipt (Printable Area 72mm)។',
      },
      {
        step: '03',
        title: 'ការកំណត់កេះថតប្រាក់ស្វ័យប្រវត្ត (RJ11 Cash Drawer)',
        desc: 'ដោតខ្សែ RJ11 ពីកេះថតប្រាក់ចូលរន្ធ Cash Drawer នៅខាងក្រោយម៉ាស៊ីនព្រីន។ ប្រព័ន្ធ ClinicOS នឹងបញ្ជូនពាក្យបញ្ជា ESC/POS Pulse ដោយស្វ័យប្រវត្តរាល់ពេលបញ្ចប់ការទូទាត់ប្រាក់។',
        code: 'ESC p 0 25 250 (Hex: 1B 70 00 19 FA)',
        tip: 'នៅក្នុង Printer Properties -> Device Settings សូមបើកជម្រើស Cash Drawer: Open Before Printing ឬ Open After Printing។',
      },
      {
        step: '04',
        title: 'កំណត់ Silent Printing លើ Browser',
        desc: 'ដើម្បីកុំឱ្យ Browser លោតផ្ទាំង Print Preview មកទាមទារចុច Enter រាល់ពេលចេញវិក្កយបត្រ សូមដំណើរការ Browser ជាមួយ flag --kiosk-printing។',
        code: 'chrome.exe --kiosk-printing --app=http://localhost:3000/billing',
        tip: 'ដំណើរការនេះអនុញ្ញាតឱ្យម៉ាស៊ីនព្រីនកាត់ក្រដាសស្វ័យប្រវត្ត (Auto-cutter) ត្រឹមតែ ០.៥ វិនាទីប៉ុណ្ណោះ។',
      },
    ],
    stepsEn: [
      {
        step: '01',
        title: 'Hardware Cable Connection',
        desc: 'Connect the USB Type-B cable to the cashier terminal or plug an RJ45 Ethernet network cable into your clinic LAN router. Confirm the blue Power LED is steady.',
      },
      {
        step: '02',
        title: 'Driver Installation & 80mm Paper Width',
        desc: 'Install the official manufacturer driver (e.g., Xprinter, Epson TM-T82, Rongta). Under Printers & Scanners settings, set standard page size to 80mm x Receipt with 72mm printable margin.',
      },
      {
        step: '03',
        title: 'Automatic RJ11 Cash Drawer Kick',
        desc: 'Plug the RJ11 cable from the cash drawer into the back port of the thermal printer. ClinicOS dispatches an ESC/POS drawer kick pulse automatically upon bill settlement.',
        code: 'ESC p 0 25 250 (Hex: 1B 70 00 19 FA)',
        tip: 'Under Printer Properties -> Device Settings, toggle Cash Drawer: Open After Printing.',
      },
      {
        step: '04',
        title: 'Enable Browser Kiosk Printing',
        desc: 'To bypass the browser print dialogue window during fast checkout queues, launch Google Chrome or Edge with the kiosk printing flag.',
        code: 'chrome.exe --kiosk-printing --app=http://localhost:3000/billing',
        tip: 'Thermal auto-cutter will trigger cut command (1D 56 00) instantly without cashier delay.',
      },
    ],
    troubleshootingKh: [
      'ក្រដាសព្រីនចេញមកសស្អាតគ្មានអក្សរ៖ សូមពិនិត្យមើលថាតើអ្នកបានដាក់ក្រដាសកម្ដៅបញ្ច្រាសមុខដែរឬទេ (Thermal coating ត្រូវនៅខាងមុខ)។',
      'ភ្លើង Error ពណ៌ក្រហមលោតញាប់ៗ៖ ម៉ាស៊ីនអាចអស់ក្រដាស ឬគម្របខាងលើមិនទាន់បានបិទស៊ប់។',
      'ព្រីនតាមបណ្ដាញ IP មិនដំណើរការ៖ ពិនិត្យមើល IP Address របស់ម៉ាស៊ីនព្រីន ត្រូវស្ថិតក្នុង Subnet ដូចគ្នានឹងកុំព្យូទ័របេឡា (ឧ. 192.168.1.xxx)។',
    ],
    troubleshootingEn: [
      'Blank paper feed without text: Ensure the thermal roll is inserted with the coated thermal side facing the print head.',
      'Flashing red Error indicator: Roll paper is empty or printer cover is not fully latched.',
      'Network IP printing timeout: Verify the printer IP address shares the same LAN subnet as your cashier computer (e.g. 192.168.1.xxx).',
    ],
  },
  {
    id: 'telegram-integration',
    category: 'telegram',
    titleKh: 'ការតភ្ជាប់ Telegram Bot & ៤ Forum Topics Supergroup',
    titleEn: 'Telegram Bot & 4 Forum Topics Supergroup Integration',
    summaryKh: 'ការណែនាំបង្កើត Bot Token តាម BotFather, ការរៀបចំ Supergroup និងការបែងចែកដំណឹងទៅកាន់ Security, Finance, Operations, និង System topics។',
    summaryEn: 'Guide to generating a dedicated Bot Token via BotFather, setting up a topic-enabled supergroup, and isolating clinic alerts across 4 forum threads.',
    stepsKh: [
      {
        step: '01',
        title: 'បង្កើត Bot តាមរយៈ @BotFather',
        desc: 'បើក Telegram ហើយស្វែងរក @BotFather។ ផ្ញើពាក្យបញ្ជា /newbot បន្ទាប់មកបញ្ចូលឈ្មោះគ្លីនិក និងកំណត់ Username បញ្ចប់ដោយពាក្យ "bot"។ រក្សាទុក HTTP API Token ដែលទទួលបាន។',
        code: '/newbot -> MyClinicAlertsBot -> myclinic_alert_bot',
        tip: 'កុំចែករំលែក Bot Token នេះជាសាធារណៈ ព្រោះវាជាសោរសម្ងាត់សម្រាប់បញ្ជាប្រព័ន្ធផ្ញើសារ។',
      },
      {
        step: '02',
        title: 'បង្កើត Supergroup និងបើកមុខងារ Forum Topics',
        desc: 'បង្កើតក្រុម Telegram ថ្មីមួយសម្រាប់បុគ្គលិកគ្លីនិក។ ចូលទៅកាន់ Group Settings -> Edit -> បើកជម្រើស "Topics" (Topics Mode) ដើម្បីឱ្យក្រុមនោះប្រែក្លាយជា Forum Supergroup។',
      },
      {
        step: '03',
        title: 'បង្កើត ៤ Topics ដាច់ដោយឡែកពីគ្នា',
        desc: 'នៅក្នុង Supergroup បង្កើត Topic ចំនួន ៤៖ (១) Security - ដំណឹងសុវត្ថិភាពនិងការ Login, (២) Finance - ដំណឹងទូទាត់ប្រាក់ KHQR និងបិទបញ្ជី, (៣) Operations - ដំណឹងហៅលេខនិងអ្នកជំងឺ, (៤) System - ដំណឹងបម្រុងទុកនិង Error។',
      },
      {
        step: '04',
        title: 'បន្ថែម Bot ចូលជា Administrator',
        desc: 'បន្ថែម Bot ដែលបានបង្កើតចូលទៅក្នុង Supergroup ហើយផ្ដល់សិទ្ធិជា Administrator ជាមួយសិទ្ធិ "Post Messages", "Manage Topics", និង "Delete Messages"។',
      },
      {
        step: '05',
        title: 'បញ្ចូល Telegram Config ក្នុង Clinic Settings',
        desc: 'ចូលទៅកាន់ Dashboard -> Clinic Settings -> ផ្នែក Telegram Integration។ បញ្ចូល Bot Token, Group Chat ID, និង Thread ID សម្រាប់ Topic នីមួយៗ រួចចុចប៊ូតុង "Test Connection"។',
      },
    ],
    stepsEn: [
      {
        step: '01',
        title: 'Create Bot via @BotFather',
        desc: 'Open Telegram and start a chat with @BotFather. Send /newbot, enter your clinic display name and choose a unique username ending with "bot". Save the generated HTTP API Token.',
        code: '/newbot -> MyClinicAlertsBot -> myclinic_alert_bot',
        tip: 'Never share your Bot API Token publicly; it controls automated outbound dispatching.',
      },
      {
        step: '02',
        title: 'Create Supergroup & Enable Forum Topics',
        desc: 'Create a new Telegram group for clinic personnel. Open Group Info -> Edit -> toggle on "Topics" to transform the group into a threaded Supergroup.',
      },
      {
        step: '03',
        title: 'Create 4 Dedicated Forum Topics',
        desc: 'Create 4 distinct topics: (1) Security - access logs and auth tamper alerts, (2) Finance - instant KHQR settlement notifications, (3) Operations - patient queue calling, (4) System - backups and health checks.',
      },
      {
        step: '04',
        title: 'Promote Bot to Administrator',
        desc: 'Add the bot into the supergroup and promote it to Administrator with permissions: Post Messages, Manage Topics, and Delete Messages.',
      },
      {
        step: '05',
        title: 'Store Credentials in Clinic Settings',
        desc: 'Navigate to Dashboard -> Clinic Settings -> Telegram Integration. Enter your Bot Token, Group Chat ID, and Thread IDs, then trigger the "Test Connection" verification.',
      },
    ],
    troubleshootingKh: [
      'Bot មិនអាចផ្ញើសារចូល Topic បាន៖ សូមពិនិត្យមើលថាតើ Bot ត្រូវបានផ្ដល់សិទ្ធិ Administrator ពេញលេញ និងមានសិទ្ធិ Manage Topics ដែរឬទេ។',
      'មិនស្គាល់ Chat ID ឬ Thread ID៖ បញ្ជូនសារតេស្តមួយចូល Topic រួចប្រើ Endpoint getUpdates របស់ Telegram ដើម្បីមើល message.message_thread_id។',
      'សារលោតចូលតែ General Topic៖ ពិនិត្យមើលតម្លៃ Thread ID ត្រូវតែជាលេខសុទ្ធ (ឧ. 2, 4, 15) មិនត្រូវទុកទំនេរឡើយ។',
    ],
    troubleshootingEn: [
      'Bot cannot post into topic: Verify that the bot is an Administrator with explicit Manage Topics permission granted.',
      'Unknown Chat ID or Thread ID: Send a test message into the topic, then inspect the getUpdates endpoint payload for message_thread_id.',
      'All notifications post to General topic: Ensure thread ID configuration holds the exact positive integer of the targeted forum thread.',
    ],
  },
  {
    id: 'khqr-deeplinks',
    category: 'khqr',
    titleKh: 'ប្រព័ន្ធទូទាត់ Dynamic KHQR PayWay & Bank Deeplinks (Paste & Go)',
    titleEn: 'Dynamic KHQR PayWay & Bank Deeplinks (Paste & Go Setup)',
    summaryKh: 'ការរៀបចំ Bakong Account ID ត្រឹមតែ ៣០ វិនាទី, ការបង្កើត Dynamic KHQR Tag 01=12 ឥតគិតកម្រៃជើងសារ និងការបញ្ជាក់លទ្ធផលស្វ័យប្រវត្តក្នុង ២ វិនាទី។',
    summaryEn: '30-second merchant onboarding, dynamic Tag 01=12 payment QR generation, zero intermediary transaction fees, and automated 2-second settlement detection.',
    stepsKh: [
      {
        step: '01',
        title: 'ស្វែងរក Bakong Account ID ពី ABA Mobile',
        desc: 'បើក App ABA Mobile -> ចុចលើ Services -> ជ្រើសរើស ABA Merchant។ ចម្លង Bakong Account ID របស់លោកអ្នក (ឧទាហរណ៍៖ clinic_angkor@aba) ឬតំណភ្ជាប់ Merchant Link ឥតគិតថ្លៃ។',
      },
      {
        step: '02',
        title: 'បញ្ចូលក្នុងផ្ទាំង Paste & Go Merchant Setup',
        desc: 'នៅពេលចុះឈ្មោះរួច ឬក្នុង Clinic Settings សូមបើកផ្ទាំង "Paste & Go Merchant Setup"។ បិទភ្ជាប់ (Paste) Bakong Account ID និងឈ្មោះគ្លីនិកផ្លូវការដែលត្រូវបង្ហាញលើ KHQR។',
      },
      {
        step: '03',
        title: 'តេស្តបង្កើត Dynamic KHQR Tag 01=12',
        desc: 'ចុចប៊ូតុង "តេស្តបង្កើត Dynamic KHQR"។ ប្រព័ន្ធនឹងគណនា CRC Checksum តាមស្តង់ដារជាតិ Bakong ភ្លាមៗ។ លោកអ្នកអាចយក App ធនាគារណាមួយមកស្កេនមើលឈ្មោះនិងចំនួនទឹកប្រាក់ជាក់ស្ដែង។',
        tip: 'Dynamic KHQR Tag 01=12 មានផ្ទុកចំនួនទឹកប្រាក់ និងលេខវិក្កយបត្ររួចជាស្រេច អតិថិជនមិនបាច់វាយចំនួនប្រាក់ដោយដៃឡើយ។',
      },
      {
        step: '04',
        title: 'ការទូទាត់ និងដឹងលទ្ធផលភ្លាមៗ (Real-Time Settlement)',
        desc: 'នៅពេលអ្នកជំងឺស្កេនទូទាត់ ប្រព័ន្ធទទួលបានការបញ្ជាក់តាម Webhook ក្នុងរយៈពេលត្រឹម ២ វិនាទី។ ផ្ទាំងបេឡានឹងបង្ហាញសញ្ញាជោគជ័យ និងបញ្ជាម៉ាស៊ីនព្រីនវិក្កយបត្រស្វ័យប្រវត្ត។',
      },
    ],
    stepsEn: [
      {
        step: '01',
        title: 'Obtain Bakong Account ID from ABA Mobile',
        desc: 'Launch the ABA Mobile app -> tap Services -> tap ABA Merchant. Copy your official Bakong Account ID (e.g. clinic_angkor@aba) or your free merchant checkout link.',
      },
      {
        step: '02',
        title: 'Paste into Merchant Setup Modal',
        desc: 'Inside Clinic Settings or during first login, open "Paste & Go Merchant Setup". Paste your Bakong Account ID, official clinic display name, and city location.',
      },
      {
        step: '03',
        title: 'Generate Dynamic Tag 01=12 Test QR',
        desc: 'Click "Test Dynamic KHQR". ClinicOS generates an official Bakong Tag 01=12 payload with 16-bit CRC checksum. Scan with any Cambodian banking app to verify name and amount accuracy.',
        tip: 'Dynamic KHQR embeds exact invoice totals and currency, preventing accidental cashier mischarges.',
      },
      {
        step: '04',
        title: 'Automated 2-Second Webhook Settlement',
        desc: 'When the patient confirms payment on their phone, the clinic webhook detects transaction settlement within 2 seconds, marks the invoice PAID, and triggers receipt printing.',
      },
    ],
    troubleshootingKh: [
      'ស្កេនហើយ App ធនាគារប្រាប់ថា Merchant មិនត្រឹមត្រូវ៖ ពិនិត្យមើល Bakong Account ID ត្រូវមានកន្ទុយធនាគារត្រឹមត្រូវ (ឧ. @aba, @acleda, @canadia)។',
      'ប្រាក់កាត់ពីគណនីអ្នកជំងឺហើយ តែអេក្រង់បេឡាមិនលោតជោគជ័យ៖ បេឡាអាចចុចប៊ូតុង "Verify Settlement" ដោយដៃ ឬពិនិត្យមើលការតភ្ជាប់អ៊ីនធឺណិតរបស់កុំព្យូទ័រ។',
      'តើប្រព័ន្ធកាត់កម្រៃជើងសារប៉ុន្មាន? ប្រព័ន្ធ KHQR របស់ ClinicOS មិនកាត់កម្រៃជើងសារលើប្រតិបត្តិការទូទាត់របស់គ្លីនិកឡើយ (0% Transaction Fee)។',
    ],
    troubleshootingEn: [
      'Banking app reports Invalid Merchant: Verify your Bakong ID contains the correct bank domain suffix (e.g. @aba, @acleda, @canadia).',
      'Patient funds deducted but cashier screen delayed: The cashier can click "Verify Settlement" to perform an immediate sync, or verify internet connectivity.',
      'Intermediary fee inquiry: ClinicOS KHQR operates with 0% transaction commission. Funds route directly into your bank merchant account.',
    ],
  },
  {
    id: 'clinical-workflow',
    category: 'workflow',
    titleKh: 'ដំណើរការពិនិត្យព្យាបាល ប្រព័ន្ធហៅលេខ និងការកាត់ស្តុកឱសថ',
    titleEn: 'Clinical Workflow, Khmer Voice Queue & Pharmacy Inventory',
    summaryKh: 'ជំហានប្រតិបត្តិការរហ័សប្រចាំថ្ងៃ៖ ការចុះឈ្មោះអ្នកជំងឺ ៦០ វិនាទី, ការហៅលេខជាសំឡេងខ្មែរ, ការពិនិត្យព្យាបាល EMR, និងការកាត់ស្តុកឱសថតាម Batch & Expiry។',
    summaryEn: 'Daily operational blueprint: 60-second patient intake, natural Khmer voice calling, structured electronic medical records, and FIFO batch inventory tracking.',
    stepsKh: [
      {
        step: '01',
        title: 'ចុះឈ្មោះអ្នកជំងឺ និងទទួលលេខរង់ចាំ (Intake & Ticket)',
        desc: 'បុគ្គលិកទទួលភ្ញៀវស្វែងរកលេខទូរស័ព្ទ ឬបង្កើតព័ត៌មានអ្នកជំងឺថ្មីក្នុងរយៈពេល ៦០ វិនាទី។ ប្រព័ន្ធបង្កើតលេខរង់ចាំ (Queue Ticket ឧ. A012) ដោយស្វ័យប្រវត្ត។',
      },
      {
        step: '02',
        title: 'ហៅអ្នកជំងឺជាសំឡេងខ្មែរ (Native Khmer Voice)',
        desc: 'វេជ្ជបណ្ឌិត ឬគិលានុបដ្ឋាយិកាចុចប៊ូតុង "ហៅអ្នកជំងឺ"។ ប្រព័ន្ធបន្លឺសំឡេងជាភាសាខ្មែរច្បាស់ៗតាមរយៈ Speaker៖ "សូមអញ្ជើញលេខ A012 ចូលបន្ទប់ពិគ្រោះលេខ ១"។',
      },
      {
        step: '03',
        title: 'កត់ត្រារោគវិនិច្ឆ័យ និងចេញវេជ្ជបញ្ជា (EMR & Prescription)',
        desc: 'វេជ្ជបណ្ឌិតកត់ត្រារោគសញ្ញា សម្ពាធឈាម ទម្ងន់ និងជ្រើសរើសថ្នាំពីបញ្ជីឱសថស្ថានគ្លីនិក។ ប្រព័ន្ធបង្ហាញតម្លៃថ្នាំ និងការណែនាំប្រើប្រាស់ជាភាសាខ្មែរ។',
      },
      {
        step: '04',
        title: 'ឱសថស្ថានកាត់ស្តុកស្វ័យប្រវត្តតាម Batch & Expiry',
        desc: 'នៅពេលចេញថ្នាំ ប្រព័ន្ធកាត់បន្ថយបរិមាណស្តុកតាមគោលការណ៍ FIFO (First In First Out) ដោយស្វ័យប្រវត្ត ដោយផ្អែកលើកាលបរិច្ឆេទផុតកំណត់នៃ Batch នីមួយៗ។',
      },
      {
        step: '05',
        title: 'ចេញវិក្កយបត្រ និងទូទាត់ប្រាក់នៅបេឡា (Billing & KHQR)',
        desc: 'បេឡាពិនិត្យមើលថ្លៃពិនិត្យនិងថ្លៃថ្នាំ រួចចុច "KHQR Dynamic" ដើម្បីបង្ហាញ QR លើអេក្រង់។ អ្នកជំងឺស្កេនទូទាត់ចប់ ម៉ាស៊ីនព្រីនចេញវិក្កយបត្រ 80mm ភ្លាម។',
      },
    ],
    stepsEn: [
      {
        step: '01',
        title: 'Patient Intake & Queue Ticket Assignment',
        desc: 'Reception searches phone records or registers a new patient profile within 60 seconds. The system assigns an sequential Queue Ticket (e.g. A012).',
      },
      {
        step: '02',
        title: 'Native Khmer Voice Queue Announcement',
        desc: 'Physician or nurse clicks "Call Patient". The audio synthesis broadcasts clearly in Khmer over clinic speakers: "សូមអញ្ជើញលេខ A012 ចូលបន្ទប់ពិគ្រោះលេខ ១".',
      },
      {
        step: '03',
        title: 'EMR Consultation & Prescription',
        desc: 'Physician records vitals, SOAP findings, diagnosis codes, and selects medicines from the pharmacy catalog. Usage instructions are localized in Khmer.',
      },
      {
        step: '04',
        title: 'Automated FIFO Batch Inventory Deduction',
        desc: 'Upon pharmacy dispensing confirmation, stock balances are automatically decremented prioritizing oldest batch expiry dates (FIFO tracking).',
      },
      {
        step: '05',
        title: 'Cashier Settlement & Instant 80mm Receipt',
        desc: 'Cashier reviews consultation and pharmacy fees, displays dynamic KHQR on customer display. Once paid, the 80mm thermal receipt prints instantly.',
      },
    ],
    troubleshootingKh: [
      'សំឡេងហៅលេខមិនឮលើ Speaker៖ សូមពិនិត្យមើលថាតើ Browser ត្រូវបានផ្ដល់សិទ្ធិ Audio Playback ដែរឬទេ និងពិនិត្យខ្សែដោត Speaker ចូលកុំព្យូទ័រ។',
      'ឱសថអស់ពីស្តុកមិនអាចចេញវេជ្ជបញ្ជាបាន៖ ចូលទៅកាន់ Pharmacy Inventory រួចធ្វើការ Restock បន្ថែម Batch ថ្មីដែលមានកាលបរិច្ឆេទផុតកំណត់ច្បាស់លាស់។',
      'អ្នកជំងឺចង់បានវិក្កយបត្រជាភាសាអង់គ្លេស៖ នៅក្នុងផ្ទាំង Billing អាចចុចប្ដូរភាសា Print Template ទៅជាភាសាអង់គ្លេសបានគ្រប់ពេល។',
    ],
    troubleshootingEn: [
      'Voice calling sound not playing: Verify browser tab has audio permission granted and external 3.5mm speaker cable is plugged in.',
      'Medicine marked out-of-stock during consultation: Open Pharmacy Inventory and add a restock shipment with batch number and expiry date.',
      'Patient requests English invoice printout: Cashier can toggle print language template to English with a single click before printing.',
    ],
  },
];

export default function HelpCenterPage() {
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedGuideId, setExpandedGuideId] = useState<string>('printer-setup');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredGuides = useMemo(() => {
    return GUIDES.filter((guide) => {
      const matchesCategory =
        selectedCategory === 'all' || guide.category === selectedCategory;

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const inTitle =
        guide.titleKh.toLowerCase().includes(q) ||
        guide.titleEn.toLowerCase().includes(q);
      const inSummary =
        guide.summaryKh.toLowerCase().includes(q) ||
        guide.summaryEn.toLowerCase().includes(q);

      return inTitle || inSummary;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-800 flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-10">
        {/* Header Hero Section */}
        <section className="text-center space-y-4 max-w-3xl mx-auto pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>
              {isKm
                ? 'មជ្ឈមណ្ឌលជំនួយ និងឯកសារបច្ចេកទេស'
                : 'Documentation & Knowledge Base'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight font-sans">
            {isKm
              ? 'មជ្ឈមណ្ឌលជំនួយ និងការណែនាំបច្ចេកទេស'
              : 'ClinicOS Help Center & Technical Manuals'}
          </h1>

          <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-sans">
            {isKm
              ? 'ឯកសារណែនាំលម្អិតអំពីការតភ្ជាប់ម៉ាស៊ីនព្រីន 80mm, ការកំណត់ Telegram Bot, ការទូទាត់ Dynamic KHQR និងរបៀបរបបដំណើរការគ្លីនិកប្រចាំថ្ងៃ។'
              : 'Official setup manuals for 80mm thermal receipt printers, Telegram supergroup bots, dynamic KHQR merchant links, and clinical operations.'}
          </p>

          {/* Search Bar */}
          <div className="pt-3 max-w-xl mx-auto">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isKm
                    ? 'ស្វែងរកមេរៀនណែនាំ, ម៉ាស៊ីនព្រីន, Telegram, KHQR, ដំណើរការគ្លីនិក...'
                    : 'Search setup guides, printer commands, Telegram, KHQR, workflow...'
                }
                className="w-full pl-11 pr-4 py-3 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-teal-700 shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 font-semibold"
                >
                  {isKm ? 'សម្អាត' : 'Clear'}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${
              selectedCategory === 'all'
                ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            {isKm ? 'ប្រធានបទទាំងអស់' : 'All Topics'}
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('printer')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${
              selectedCategory === 'printer'
                ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isKm ? 'ម៉ាស៊ីនព្រីនកម្ដៅ 80mm' : '80mm POS Printer'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('telegram')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${
              selectedCategory === 'telegram'
                ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isKm ? 'Telegram Bot & Topics' : 'Telegram Bot & Topics'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('khqr')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${
              selectedCategory === 'khqr'
                ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{isKm ? 'Dynamic KHQR PayWay' : 'Dynamic KHQR PayWay'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('workflow')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${
              selectedCategory === 'workflow'
                ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>{isKm ? 'ដំណើរការគ្លីនិក & ហៅលេខ' : 'Clinical Workflow & Queue'}</span>
          </button>
        </div>

        {/* Guides List */}
        <section className="space-y-6">
          {filteredGuides.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center space-y-3">
              <HelpCircle className="w-8 h-8 text-stone-400 mx-auto" />
              <div className="font-bold text-stone-900 text-sm">
                {isKm ? 'រកមិនឃើញមេរៀនដែលអ្នកស្វែងរកឡើយ' : 'No documentation matches found'}
              </div>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                {isKm
                  ? 'សូមសាកល្បងស្វែងរកជាមួយពាក្យគន្លឹះផ្សេង ឬសម្អាតប្រអប់ស្វែងរកដើម្បីមើលមេរៀនទាំងអស់។'
                  : 'Try modifying your search keywords or reset filter to view all available manuals.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="mt-2 text-xs font-bold text-teal-800 hover:underline"
              >
                {isKm ? 'មើលប្រធានបទទាំងអស់' : 'Reset & Show All'}
              </button>
            </div>
          ) : (
            filteredGuides.map((guide) => {
              const isExpanded = expandedGuideId === guide.id;
              const steps = isKm ? guide.stepsKh : guide.stepsEn;
              const troubleshooting = isKm
                ? guide.troubleshootingKh
                : guide.troubleshootingEn;

              return (
                <div
                  key={guide.id}
                  className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs transition-all"
                >
                  {/* Guide Header Accordion Trigger */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedGuideId(isExpanded ? '' : guide.id)
                    }
                    className="w-full p-6 text-left flex items-start justify-between gap-4 hover:bg-stone-50/70 transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                        {guide.category === 'printer' && (
                          <Printer className="w-5 h-5 text-teal-800" />
                        )}
                        {guide.category === 'telegram' && (
                          <Send className="w-5 h-5 text-teal-800" />
                        )}
                        {guide.category === 'khqr' && (
                          <QrCode className="w-5 h-5 text-teal-800" />
                        )}
                        {guide.category === 'workflow' && (
                          <Stethoscope className="w-5 h-5 text-teal-800" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                          {guide.category === 'printer' && 'Hardware Module'}
                          {guide.category === 'telegram' && 'Communication Bridge'}
                          {guide.category === 'khqr' && 'Financial Settlement'}
                          {guide.category === 'workflow' && 'Clinical Operations'}
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-stone-900 font-sans">
                          {isKm ? guide.titleKh : guide.titleEn}
                        </h2>
                        <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                          {isKm ? guide.summaryKh : guide.summaryEn}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 pt-1 text-stone-400">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-teal-800" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-stone-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Guide Content */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-stone-100 space-y-6">
                      {/* Step-by-step Cards */}
                      <div className="space-y-3.5">
                        <div className="font-bold text-xs uppercase tracking-wider text-stone-800">
                          {isKm ? 'ជំហានអនុវត្តជាក់ស្ដែង' : 'Step-by-Step Instructions'}
                        </div>

                        <div className="grid grid-cols-1 gap-3.5">
                          {steps.map((st) => (
                            <div
                              key={st.step}
                              className="p-4 rounded-xl border border-stone-200 bg-[#FAF7F2]/60 space-y-2 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-teal-800 font-bold bg-teal-100/70 px-2 py-0.5 rounded text-[11px]">
                                  Step {st.step}
                                </span>
                                <span className="font-bold text-stone-900 text-xs sm:text-sm">
                                  {st.title}
                                </span>
                              </div>

                              <p className="text-stone-600 leading-relaxed pl-1">
                                {st.desc}
                              </p>

                              {st.code && (
                                <div className="mt-2 rounded-lg bg-stone-900 text-stone-100 p-2.5 font-mono text-[11px] flex items-center justify-between gap-2 overflow-x-auto">
                                  <div className="flex items-center gap-2">
                                    <Terminal className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                                    <span>{st.code}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyCode(st.code!)}
                                    className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-white transition-colors shrink-0"
                                    title="Copy Code"
                                  >
                                    {copiedCode === st.code ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              )}

                              {st.tip && (
                                <div className="mt-1 flex items-start gap-1.5 text-[11px] text-teal-900 bg-teal-50/70 border border-teal-100 p-2 rounded-lg">
                                  <Zap className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                                  <span>{st.tip}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Troubleshooting Accordion Box */}
                      {troubleshooting && troubleshooting.length > 0 && (
                        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/70 space-y-2 text-xs">
                          <div className="flex items-center gap-2 font-bold text-amber-900 text-xs uppercase tracking-wide">
                            <ShieldCheck className="w-4 h-4 text-amber-800" />
                            <span>
                              {isKm
                                ? 'ដំណោះស្រាយបញ្ហាទូទៅ (Troubleshooting)'
                                : 'Common Troubleshooting & Diagnostics'}
                            </span>
                          </div>

                          <ul className="space-y-1.5 text-stone-700 text-xs pl-1">
                            {troubleshooting.map((issue, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-amber-800 font-bold">•</span>
                                <span className="leading-relaxed">{issue}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>

        {/* Technical Support & Direct Contact Box */}
        <section className="bg-gradient-to-br from-teal-900 to-stone-900 text-white rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 text-teal-300 text-xs font-semibold uppercase tracking-wider">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{isKm ? 'ជំនួយបច្ចេកទេសផ្ទាល់' : 'Dedicated Technical Assistance'}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-sans">
              {isKm
                ? 'ត្រូវការជំនួយក្នុងការតភ្ជាប់ឧបករណ៍ ឬប្រព័ន្ធ?'
                : 'Need on-site or remote integration assistance?'}
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-sans">
              {isKm
                ? 'ក្រុមការងារបច្ចេកទេស ClinicOS ត្រៀមខ្លួនជួយសម្របសម្រួលដំឡើងម៉ាស៊ីនព្រីន 80mm, រៀបចំ Telegram Bot និងបង្រៀនបុគ្គលិកគ្លីនិកផ្ទាល់តាមប្រព័ន្ធ Online ២៤/៧។'
                : 'Our engineering support team is available around the clock to guide your hardware setup, verify Telegram topics, and onboard your clinic staff.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href="https://t.me"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-stone-950 font-bold text-xs transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isKm ? 'ឆានែល Telegram ជំនួយបច្ចេកទេស' : 'Telegram Support Channel'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-medium text-xs">
              <PhoneCall className="w-3.5 h-3.5 text-teal-300" />
              <span>{isKm ? 'លេខបន្ទាន់៖ +855 23 999 888' : 'Hotline: +855 23 999 888'}</span>
            </div>

            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold transition-colors ml-auto"
            >
              <span>{isKm ? 'ចុះឈ្មោះបង្កើត Workspace (៦០ វិ)' : 'Register Clinic (60 Seconds)'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
