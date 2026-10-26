import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import iconv from "iconv-lite";

const outputDir = path.join(process.cwd(), "docs", "sample-imports");

function writeWorkbook(
  fileName: string,
  sheets: { name: string; rows: string[][] }[],
) {
  const workbook = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const worksheet = XLSX.utils.aoa_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  }

  XLSX.writeFile(workbook, path.join(outputDir, fileName));
}

function csvCell(value: string): string {
  if (/[;"\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv(rows: string[][]): string {
  return rows
    .map((row) => row.map((cell) => csvCell(cell)).join(";"))
    .join("\r\n");
}

function generateCleanRussian() {
  writeWorkbook("clean-russian.xlsx", [
    {
      name: "Товары",
      rows: [
        [
          "Артикул",
          "Наименование",
          "Цена",
          "Остаток",
          "Бренд",
          "Категория",
          "Совместимость",
          "Ед. изм.",
        ],
        [
          "ТЛ-1001",
          "Тормозная колодка передняя",
          "12 500",
          "5",
          "ТехноЛайн",
          "Тормозная система",
          "Toyota Camry 2018–2024",
          "шт.",
        ],
        [
          "ТЛ-1002",
          "Тормозной диск передний",
          "18 900",
          "3",
          "ТехноЛайн",
          "Тормозная система",
          "Toyota Camry",
          "шт.",
        ],
        [
          "\u200BФ-2001",
          "Фильтр масляный",
          "2 450",
          "24",
          "ГрандФильтр",
          "Фильтры",
          "Universal",
          "шт.",
        ],
        [
          "Ф-2002",
          "Фильтр воздушный",
          "3 100",
          "0",
          "ГрандФильтр",
          "Фильтры",
          "Kia Rio",
          "шт.",
        ],
        [
          "М-3001",
          "Масло моторное 5W-30, 4 л",
          "21 500",
          "12",
          "ОйлПро",
          "Масла и жидкости",
          "—",
          "канистра",
        ],
        [
          "Д-4001",
          "Ремень ГРМ",
          "9 800",
          ">10",
          "МоторКрафт",
          "Двигатель",
          "Hyundai Accent",
          "шт.",
        ],
        [
          "Э-5001",
          "Аккумулятор 60Ah",
          "45 000",
          "есть",
          "АвтоЭра",
          "Электрика",
          "Universal",
          "шт.",
        ],
        [
          "П-6001",
          "Амортизатор задний",
          "27 300",
          "нет",
          "АвтоЭра",
          "Подвеска",
          "Toyota Corolla",
          "шт.",
        ],
      ],
    },
  ]);
}

function generateEnglishWithCompanyHeader() {
  writeWorkbook("english-company-header.xlsx", [
    {
      name: "Price list 2026",
      rows: [
        ["ACME AUTO PARTS LLC"],
        ["Wholesale price list — October 2026"],
        [""],
        [
          "Part No",
          "Product Name",
          "Unit Price",
          "Qty",
          "Brand",
          "Category",
          "Compatibility",
          "Unit",
        ],
        ["ACM-001", "Oil Filter", "25.50", "40", "Bosch", "Filters", "Toyota Camry", "pcs"],
        ["ACM-002", "Air Filter", "18.00", "15", "Bosch", "Filters", "Kia Rio", "pcs"],
        ["ACM-003", "Brake Pad Set", "89.99", "8", "Brembo", "Brakes", "BMW 3 Series", "set"],
        ["ACM-004", "Shock Absorber", "120.00", "4", "KYB", "Suspension", "Toyota Corolla", "pcs"],
        ["ACM-005", "Timing Belt Kit", "150.75", ">5", "Gates", "Engine", "Hyundai Accent", "kit"],
        ["ACM-006", "Cabin Filter", "12.40", "out of stock", "Mann", "Filters", "Universal", "pcs"],
      ],
    },
    {
      name: "Archive",
      rows: [
        ["SKU", "Name", "Price", "Stock"],
        ["ARC-001", "Old Filter", "10.00", "2"],
        ["ARC-002", "Old Belt", "15.00", "1"],
      ],
    },
  ]);
}

function generateChinese() {
  writeWorkbook("chinese-headers.xlsx", [
    {
      name: "库存",
      rows: [
        ["编号", "名称", "价格", "库存", "品牌", "分类", "适用车型", "单位"],
        ["CN-1001", "机油滤清器", "25", "100", "博世", "滤清器", "丰田凯美瑞", "个"],
        ["CN-1002", "空气滤清器", "18", "50", "博世", "滤清器", "起亚K2", "个"],
        ["CN-1003", "刹车片", "88", ">10", "布雷博", "刹车系统", "宝马3系", "套"],
        ["CN-1004", "减震器", "120", "有货", "KYB", "悬挂系统", "丰田卡罗拉", "个"],
        ["CN-1005", "正时皮带", "150", "无货", "盖茨", "发动机", "现代雅绅特", "套"],
      ],
    },
  ]);
}

function generateDirtyCsv() {
  const rows: string[][] = [
    ['ТОО "АвтоСклад" — прайс-лист от 01.10.2026'],
    [""],
    [
      "Арт.",
      "Наименование товара",
      "Цена, тг",
      "Кол-во",
      "Бренд",
      "Категория",
      "Совместимость",
    ],
    [
      "A-100",
      'Масляный фильтр "Премиум", большой',
      "12 500 тг",
      "5 шт",
      "ТехноЛайн",
      "Фильтры",
      "Toyota Camry",
    ],
    [
      "а 101",
      "Воздушный фильтр",
      "8 990 тг",
      ">10",
      "ГрандФильтр",
      "Фильтры",
      "Kia Rio",
    ],
    [
      "A-102",
      "Топливный фильтр",
      "1 234,50 тг",
      "есть",
      "ГрандФильтр",
      "Фильтры",
      "Universal",
    ],
    [
      "A-103\u00A0",
      "Свеча зажигания",
      "2.500 тг",
      "нет",
      "АвтоЭра",
      "Электрика",
      "—",
    ],
    [
      "A-104",
      "Ремень генератора",
      "по запросу",
      "12",
      "МоторКрафт",
      "Двигатель",
      "Hyundai Accent",
    ],
    [
      "abc 123",
      "Название-дубль",
      "7 000 тг",
      "3 шт",
      "Бренд",
      "Категория",
      "Авто",
    ],
    [
      "ABC-123",
      "Название-дубль последняя",
      "7 500 тг",
      "4 шт",
      "Бренд",
      "Категория",
      "Авто",
    ],
    [
      "A-105",
      "Фильтр масляный; усиленный",
      "9 100 тг",
      "7 шт",
      "ТехноЛайн",
      "Фильтры",
      "Универсал",
    ],
    [""],
    ["Итого", "", "", "", "", "", ""],
  ];

  const text = toCsv(rows);
  const encoded = iconv.encode(text, "win1251");
  fs.writeFileSync(path.join(outputDir, "dirty-windows1251.csv"), encoded);
}

function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  generateCleanRussian();
  generateEnglishWithCompanyHeader();
  generateChinese();
  generateDirtyCsv();

  console.log(`Тестовые файлы записаны в ${outputDir}`);
}

main();
