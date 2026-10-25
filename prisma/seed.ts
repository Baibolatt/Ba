import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

const categories = [
  {
    slug: "brakes",
    name: "Тормозная система",
    shortName: "Тормоза",
    description: "Колодки, диски, суппорты",
    icon: "brake",
  },
  {
    slug: "filters",
    name: "Фильтры",
    shortName: "Фильтры",
    description: "Масляные, воздушные, салонные",
    icon: "filter",
  },
  {
    slug: "oils",
    name: "Масла и жидкости",
    shortName: "Масла",
    description: "Моторные масла, антифризы",
    icon: "droplet",
  },
  {
    slug: "engine",
    name: "Двигатель",
    shortName: "Двигатель",
    description: "Ремни, ролики, прокладки",
    icon: "gear",
  },
  {
    slug: "suspension",
    name: "Подвеска",
    shortName: "Подвеска",
    description: "Амортизаторы, пружины, рычаги",
    icon: "spring",
  },
  {
    slug: "electric",
    name: "Электрика",
    shortName: "Электрика",
    description: "Аккумуляторы, свечи, датчики",
    icon: "battery",
  },
];

const brands = [
  { name: "ТехноЛайн" },
  { name: "АвтоЭра" },
  { name: "МоторКрафт" },
  { name: "ГрандФильтр" },
  { name: "ОйлПро" },
  { name: "СевероПартс" },
];

const products = [
  {
    id: "tl-2418",
    name: "Колодки тормозные передние",
    brand: "ТехноЛайн",
    article: "TL-2418",
    category: "brakes",
    price: 12900,
    oldPrice: 14900,
    quantity: 24,
    unit: "комплект",
    description:
      "Комплект передних тормозных колодок для повседневной эксплуатации. Малошумный керамический состав устойчив к перегреву и пыли.",
    compatibility: "Toyota Camry (2018–2024), Kia K5 (2020–2024)",
    badge: "Хит",
    specs: [
      { label: "Тип", value: "Колодки дисковые" },
      { label: "Ось", value: "Передняя" },
      { label: "Количество в упаковке", value: "4 шт." },
      { label: "Материал", value: "Керамика" },
      { label: "Гарантия", value: "12 месяцев" },
    ],
  },
  {
    id: "ae-5520",
    name: "Диск тормозной вентилируемый",
    brand: "АвтоЭра",
    article: "AE-5520",
    category: "brakes",
    price: 21900,
    quantity: 8,
    unit: "шт.",
    description:
      "Вентилируемый тормозной диск с антикоррозийным покрытием. Равномерный отвод тепла и стабильное торможение под нагрузкой.",
    compatibility: "Hyundai Tucson (2015–2021), Kia Sportage (2016–2021)",
    specs: [
      { label: "Тип", value: "Диск вентилируемый" },
      { label: "Диаметр", value: "300 мм" },
      { label: "Толщина", value: "28 мм" },
      { label: "Количество отверстий", value: "5" },
      { label: "Гарантия", value: "12 месяцев" },
    ],
  },
  {
    id: "mk-1130",
    name: "Суппорт тормозной задний левый",
    brand: "МоторКрафт",
    article: "MK-1130",
    category: "brakes",
    price: 54000,
    quantity: 2,
    unit: "шт.",
    description:
      "Задний левый суппорт в сборе. Чугунный корпус, защитное покрытие и проверенная геометрия посадочных мест.",
    compatibility:
      "Volkswagen Passat B7 (2011–2015), Skoda Octavia A7 (2013–2020)",
    specs: [
      { label: "Сторона", value: "Задняя левая" },
      { label: "Тип", value: "Суппорт в сборе" },
      { label: "Материал", value: "Чугун" },
      { label: "Гарантия", value: "12 месяцев" },
    ],
  },
  {
    id: "gf-1042",
    name: "Фильтр масляный",
    brand: "ГрандФильтр",
    article: "GF-1042",
    category: "filters",
    price: 2200,
    quantity: 56,
    unit: "шт.",
    description:
      "Масляный фильтр с многослойной фильтрующей бумагой и обратным клапаном. Подходит для планового обслуживания.",
    compatibility:
      "Toyota, Hyundai, Kia — двигатели 1.6–2.5 (уточните артикул)",
    badge: "Хит",
    specs: [
      { label: "Тип", value: "Масляный" },
      { label: "Резьба", value: "M20×1.5" },
      { label: "Высота", value: "79 мм" },
      { label: "Гарантия", value: "12 месяцев" },
    ],
  },
  {
    id: "gf-2205",
    name: "Фильтр воздушный панельный",
    brand: "ГрандФильтр",
    article: "GF-2205",
    category: "filters",
    price: 4500,
    quantity: 14,
    unit: "шт.",
    description:
      "Панельный воздушный фильтр с высокой пылеёмкостью. Сохраняет стабильный поток воздуха и защищает двигатель.",
    compatibility: "Toyota Camry, Corolla; Hyundai Elantra",
    specs: [
      { label: "Тип", value: "Воздушный" },
      { label: "Форма", value: "Панельный" },
      { label: "Длина", value: "285 мм" },
      { label: "Ширина", value: "190 мм" },
    ],
  },
  {
    id: "op-540",
    name: "Масло моторное 5W-40, 4 л",
    brand: "ОйлПро",
    article: "OP-540",
    category: "oils",
    price: 14900,
    oldPrice: 16900,
    quantity: 32,
    unit: "канистра",
    description:
      "Синтетическое моторное масло для бензиновых и дизельных двигателей. Стабильная вязкость в городском цикле.",
    compatibility:
      "Бензиновые и дизельные двигатели без DPF, допуск API SN",
    badge: "Хит",
    specs: [
      { label: "Вязкость", value: "5W-40" },
      { label: "Объём", value: "4 л" },
      { label: "Допуск", value: "API SN" },
      { label: "Тип", value: "Синтетическое" },
    ],
  },
  {
    id: "op-g12",
    name: "Антифриз G12, 5 л",
    brand: "ОйлПро",
    article: "OP-G12",
    category: "oils",
    price: 5200,
    quantity: 3,
    unit: "канистра",
    description:
      "Готовый к применению антифриз класса G12. Защищает систему охлаждения от коррозии и замерзания.",
    compatibility: "Легковые автомобили, системы охлаждения",
    specs: [
      { label: "Класс", value: "G12" },
      { label: "Объём", value: "5 л" },
      { label: "Цвет", value: "Красный" },
      { label: "Температура", value: "до −40 °C" },
    ],
  },
  {
    id: "tl-8802",
    name: "Ремень ГРМ",
    brand: "ТехноЛайн",
    article: "TL-8802",
    category: "engine",
    price: 11500,
    quantity: 0,
    unit: "шт.",
    description:
      "Зубчатый ремень ГРМ из HNBR. Устойчив к растяжению и высоким температурам. Перед заказом уточните артикул у менеджера.",
    compatibility: "Ford Focus II (2005–2011), Volvo S40",
    specs: [
      { label: "Тип", value: "Ремень ГРМ" },
      { label: "Количество зубьев", value: "153" },
      { label: "Ширина", value: "25 мм" },
      { label: "Материал", value: "HNBR" },
    ],
  },
  {
    id: "ae-7701",
    name: "Свеча зажигания иридиевая",
    brand: "АвтоЭра",
    article: "AE-7701",
    category: "electric",
    price: 2600,
    quantity: 120,
    unit: "шт.",
    description:
      "Иридиевая свеча зажигания с ресурсом до 60 000 км. Стабильная искра и уверенный запуск в холодное время.",
    compatibility: "Nissan, Renault, Hyundai — бензиновые двигатели",
    badge: "Новинка",
    specs: [
      { label: "Тип", value: "Иридиевая" },
      { label: "Резьба", value: "M14×1.25" },
      { label: "Зазор", value: "0.8 мм" },
      { label: "Количество", value: "1 шт." },
    ],
  },
  {
    id: "mk-3310",
    name: "Амортизатор передний газомасляный",
    brand: "МоторКрафт",
    article: "MK-3310",
    category: "suspension",
    price: 27900,
    quantity: 6,
    unit: "шт.",
    description:
      "Передний газомасляный амортизатор для городских дорог. Собран и проверен на стенде, готов к установке.",
    compatibility: "Toyota Camry XV70, Kia K5",
    specs: [
      { label: "Ось", value: "Передняя" },
      { label: "Тип", value: "Газомасляный" },
      { label: "Сторона", value: "Универсальная" },
      { label: "Гарантия", value: "12 месяцев" },
    ],
  },
  {
    id: "sp-6120",
    name: "Пружина подвески передняя",
    brand: "СевероПартс",
    article: "SP-6120",
    category: "suspension",
    price: 18500,
    quantity: 2,
    unit: "шт.",
    description:
      "Передняя пружина стандартной жёсткости с защитным покрытием. Восстанавливает штатную высоту кузова.",
    compatibility: "Hyundai Creta (2016–2021), Kia Rio X",
    specs: [
      { label: "Ось", value: "Передняя" },
      { label: "Тип", value: "Пружина подвески" },
      { label: "Высота", value: "340 мм" },
      { label: "Жёсткость", value: "Стандарт" },
    ],
  },
  {
    id: "sp-600",
    name: "Аккумулятор 60 Ач",
    brand: "СевероПартс",
    article: "SP-600",
    category: "electric",
    price: 42000,
    oldPrice: 46000,
    quantity: 5,
    unit: "шт.",
    description:
      "Необслуживаемый аккумулятор для легковых автомобилей. Устойчив к глубоким разрядам и низким температурам.",
    compatibility: "Универсальный, легковые автомобили",
    specs: [
      { label: "Ёмкость", value: "60 Ач" },
      { label: "Пусковой ток", value: "540 А" },
      { label: "Полярность", value: "Обратная" },
      { label: "Габариты", value: "242×175×190 мм" },
    ],
  },
];

const orders = [
  {
    id: "ph-241024-02",
    number: "PH-241024-02",
    customerName: "Алексей Смирнов",
    phone: "+7 (700) 000-00-00",
    address: "Тараз, ул. Жибек Жолы, 12, кв. 45",
    deliveryMethod: "courier",
    comment: null,
    payment: "Счёт для юрлица",
    status: "new",
    createdAt: new Date("2026-10-24T14:20:00+06:00"),
    items: [
      { productId: "ae-5520", quantity: 1, price: 21900 },
      { productId: "ae-7701", quantity: 4, price: 2600 },
    ],
  },
  {
    id: "ph-241022-01",
    number: "PH-241022-01",
    customerName: "Алексей Смирнов",
    phone: "+7 (700) 000-00-00",
    address: "Тараз, пункт выдачи «Жибек Жолы, 12»",
    deliveryMethod: "pickup",
    comment: "Позвонить за час до выдачи",
    payment: "При получении",
    status: "in_progress",
    createdAt: new Date("2026-10-22T18:40:00+06:00"),
    items: [
      { productId: "op-540", quantity: 1, price: 14900 },
      { productId: "gf-2205", quantity: 1, price: 4500 },
    ],
  },
  {
    id: "ph-241018-03",
    number: "PH-241018-03",
    customerName: "Алексей Смирнов",
    phone: "+7 (700) 000-00-00",
    address: "Тараз, ул. Жибек Жолы, 12, кв. 45",
    deliveryMethod: "courier",
    comment: null,
    payment: "Картой при получении",
    status: "done",
    createdAt: new Date("2026-10-18T11:05:00+06:00"),
    items: [
      { productId: "tl-2418", quantity: 2, price: 12900 },
      { productId: "gf-1042", quantity: 1, price: 2200 },
    ],
  },
];

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productSpec.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();

  const categoryIds = new Map<string, string>();
  for (const [index, category] of categories.entries()) {
    const created = await prisma.category.create({
      data: { ...category, sortOrder: index },
    });
    categoryIds.set(created.slug, created.id);
  }

  const brandIds = new Map<string, string>();
  for (const brand of brands) {
    const created = await prisma.brand.create({ data: brand });
    brandIds.set(created.name, created.id);
  }

  for (const [index, product] of products.entries()) {
    const { brand, category, specs, ...data } = product;
    const brandId = brandIds.get(brand);
    const categoryId = categoryIds.get(category);

    if (!brandId || !categoryId) {
      throw new Error(`Не найден бренд или категория для ${product.id}`);
    }

    await prisma.product.create({
      data: {
        ...data,
        brandId,
        categoryId,
        sortOrder: index,
        specs: {
          create: specs.map((spec, specIndex) => ({
            ...spec,
            sortOrder: specIndex,
          })),
        },
      },
    });
  }

  for (const { items, ...order } of orders) {
    await prisma.order.create({
      data: {
        ...order,
        items: { create: items },
      },
    });
  }

  console.log(
    `Готово: ${categories.length} категорий, ${brands.length} брендов, ` +
      `${products.length} товаров, ${orders.length} заказов.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
