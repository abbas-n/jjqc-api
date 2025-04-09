const venom = require('venom-bot');

venom
  .create({
    session: 'salon-bot',
    headless: 'new',
    multidevice: true
  })
  .then((client) => start(client))
  .catch((error) => console.log("❌ خطا در راه‌اندازی واتس‌اپ:", error));

const userState = {}; // ذخیره وضعیت کاربران
const reservations = {}; // ذخیره اطلاعات رزرو هر کاربر

function start(client) {
  console.log("✅ ربات سالن زیبایی فعال شد!");

  client.onMessage(async (message) => {
    const chatId = message.from;

    if (!userState[chatId]) {
      userState[chatId] = 'welcome';
    }

    switch (userState[chatId]) {
      case 'welcome':
        await client.sendText(chatId, 
          'سلام عزیزم! 💖\nبه سالن زیبایی هما خوش اومدی 🌸\nچطور می‌تونم کمکت کنم؟ ✨\n\n' +
          '1️⃣ رزرو وقت 📅\n' +
          '2️⃣ سوال دارم ❓\n' +
          '3️⃣ مشاهده خدمات 💆‍♀️\n\n' +
          '🔹 لطفاً عدد موردنظر را ارسال کنید.'
        );
        userState[chatId] = 'main-menu';
        break;

      case 'main-menu':
        if (message.body === '1') {
          await client.sendText(chatId, 
            'عالیه عزیزم! 😍\nچه خدمتی می‌خوای؟\n\n' +
            '1️⃣ مانیکور ساده\n' +
            '2️⃣ مانیکور ژل\n' +
            '3️⃣ کاشت ناخن\n' +
            '4️⃣ ترمیم ناخن\n' +
            '5️⃣ طراحی ناخن\n' +
            '6️⃣ ریمو ژل/کاشت\n\n' +
            '🔹 لطفاً عدد گزینه موردنظر رو بفرست.'
          );
          userState[chatId] = 'select-service';
        } else if (message.body === '2') {
          await client.sendText(chatId, '❓ سوالت رو بپرس عزیزم، من اینجام که کمکت کنم! 😊');
          userState[chatId] = 'waiting-for-question';
        } else if (message.body === '3') {
          await client.sendText(chatId, '💆‍♀️ خدمات ما:\n✔ مانیکور\n✔ کاشت ناخن\n✔ طراحی ناخن\n✔ و خیلی چیزهای دیگه!');
          userState[chatId] = 'welcome';
        } else {
          await client.sendText(chatId, '❌ گزینه نامعتبر! لطفاً فقط عدد موردنظر را ارسال کن.');
        }
        break;

      case 'select-service':
        if (['1', '2', '3', '4', '5', '6'].includes(message.body)) {
          reservations[chatId] = { service: message.body };
          await client.sendText(chatId, 
            'عالیه! 😍 حالا دوست داری با کدوم متخصص وقت بگیری؟\n\n' +
            '1️⃣ نازنین - طراحی و فرنچ ژل\n' +
            '2️⃣ فریبا - کاشت و ترمیم حرفه‌ای\n' +
            '3️⃣ فرنار - مانیکور ژل و سرعت بالا\n' +
            '4️⃣ معرفی متخصصین و نمونه کارها\n\n' +
            '🔹 لطفاً عدد موردنظر را ارسال کنید.'
          );
          userState[chatId] = 'select-expert';
        } else {
          await client.sendText(chatId, '❌ لطفاً فقط عدد گزینه موردنظر را ارسال کن.');
        }
        break;

      case 'select-expert':
        if (['1', '2', '3'].includes(message.body)) {
          reservations[chatId].expert = message.body;
          await client.sendText(chatId, '📅 چه روزی وقت می‌خوای عزیزم؟ لطفاً تاریخ رو بنویس (مثلاً: 25 اسفند).');
          userState[chatId] = 'select-date';
        } else if (message.body === '4') {
          await client.sendText(chatId, '📝 متخصصین ما:\n✔ نازنین: متخصص طراحی ناخن\n✔ فریبا: متخصص کاشت و ترمیم\n✔ فرنار: متخصص مانیکور');
        } else {
          await client.sendText(chatId, '❌ لطفاً فقط عدد گزینه موردنظر را ارسال کن.');
        }
        break;

      case 'select-date':
        reservations[chatId].date = message.body;
        await client.sendText(chatId, 
          '⏰ چه ساعتی راحت‌تری؟\n\n' +
          '1️⃣ 10:00\n' +
          '2️⃣ 12:15\n' +
          '3️⃣ 15:30\n\n' +
          '🔹 لطفاً عدد موردنظر را ارسال کن.'
        );
        userState[chatId] = 'select-time';
        break;

      case 'select-time':
        if (['1', '2', '3'].includes(message.body)) {
          reservations[chatId].time = message.body;
          await client.sendText(chatId, 
            `✅ رزروت با موفقیت ثبت شد! 🎉\n\n` +
            `💅 سرویس: ${reservations[chatId].service}\n` +
            `👩‍🎨 متخصص: ${reservations[chatId].expert}\n` +
            `📅 تاریخ: ${reservations[chatId].date}\n` +
            `⏰ ساعت: ${reservations[chatId].time}\n\n` +
            `📍 آدرس سالن: [لینک گوگل مپ]`
          );
          userState[chatId] = 'welcome';
        } else {
          await client.sendText(chatId, '❌ لطفاً فقط عدد گزینه موردنظر را ارسال کن.');
        }
        break;

      case 'waiting-for-question':
        await client.sendText(chatId, '✅ سوالت دریافت شد! به زودی پاسخ می‌دیم. 😊');
        userState[chatId] = 'welcome';
        break;

      default:
        await client.sendText(chatId, '❌ دستور نامعتبر! لطفاً از گزینه‌های داده شده استفاده کن.');
    }
  });
}
