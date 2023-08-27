import puppeteer, { Page } from 'puppeteer';
import { config } from 'dotenv'
config();
const DELAY = 500;

type Pren = {
  day: number,
  time: string,
  title: string
};



(async () => {


  const toPreonotare: Pren[] = [
    { day: 3, time: '10:15', title: 'FERRARI' },
    { day: 3, time: '14:30', title: 'HENRY SUGAR' },
    { day: 3, time: '17:30', title: 'EL CONDE' },
    { day: 4, time: '11:00', title: 'POOR THINGS' },
    { day: 4, time: '17:00', title: 'BASTARDEN' },
  ]


  // Launch the browser and open a new blank page
  for (const p of toPreonotare) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({width: 1000, height: 900});
    book(page, p)
  }
})();

async function book(page: Page, p: Pren) {
  await page.goto('https://biennalecinemaaccrediti.vivaticket.it/');
  
  let daySelected = false;
  let bookingFound = false;
  while (!daySelected) {
    await delay(DELAY);
    await login(page);
    if (!daySelected)
      daySelected = await chooseDay(page, p.day);
  }

  while (!bookingFound) {
    await delay(DELAY);
    await findBooking(page, p);
    await confirmBooking(page);
  }
}

async function login(page: Page) {
  console.log('login')

  try {
    const input = await page.$('.page-content .form-control[type="text"]')
    const psw = await page.$('.page-content .form-control[type="password"]')
    if (input && psw) {
      await input.type(process.env.EMAIL ?? '')
      await psw.type(process.env.PASSWORD ?? '')
    }
    (await page.$('.page-content .btn[type="submit"]'))?.click()
  } catch (e) {}
}

async function chooseDay(page: Page, day: number): Promise<boolean> {
  console.log('chooseDay')

  try {
    const btn = (await page.$(`#btn${day}`))
    if (btn) {
      await btn.click()
      return true
    }
  } catch (e) {}
  return false
}

async function findBooking(page: Page, p: Pren): Promise<boolean> {
  console.log('findBooking')

  const accessType = 'Tutti gli Accrediti'.toLowerCase()
  const time = p.time
  const title = p.title.toLowerCase()

  let found = false;
  try {
    const lines = await page.$$('.event-list tr');
    for (const l of lines.filter((x, i) => i !== 0)) {
      const els = await l.$$('td');
      const infos = await Promise.all(els.map(e => e.evaluate((el) => el.textContent?.toLocaleLowerCase())))
      if (infos[0] === time && infos[2]?.includes(accessType) && infos[2]?.includes(title)) {
        await els[4].click()
        return true;
      }
    };
  } catch (e) {}
  return found;
}

async function confirmBooking(page: Page): Promise<boolean> {
  console.log('confirmBooking')

  try {
    const btn = await page.$('.page-content .text-right .btn')
    console.log(btn)
    await page.click('.page-content .text-right .btn')
  } catch (e) { console.log(e) }
  return false
}

async function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}