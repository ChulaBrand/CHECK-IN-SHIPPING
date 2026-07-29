import { prisma } from "../src/lib/db";
import { CHECKIN_STATUS } from "../src/lib/options";
import { serializeMultiSelect } from "../src/lib/utils";

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000);
const minutesAgo = (m: number) => new Date(now - m * 60 * 1000);

async function main() {
  await prisma.checkIn.deleteMany();

  await prisma.checkIn.createMany({
    data: [
      {
        date: hoursAgo(1),
        createdAt: hoursAgo(1),
        driverName: "Juan Pérez",
        truckOrCompanyName: "Transportes Rustam",
        trailerPlates: "4SJ8919",
        driversLicense: "MX-8827311",
        phoneNumber: "656 123 4567",
        loadingType: "Loading / Cargar",
        unitNumber: "27",
        produceType: "Aguacates",
        loadAccommodation: "Straight / Derechas",
        spNumberOrder: "383361",
        status: CHECKIN_STATUS.OPEN,
      },
      {
        date: hoursAgo(5),
        createdAt: hoursAgo(5),
        driverName: "María Gómez",
        truckOrCompanyName: "Clemens Inter",
        trailerPlates: "MJV0459 TX",
        driversLicense: "TX-4471209",
        phoneNumber: "915 555 0182",
        loadingType: "Unloading / Descargar",
        unitNumber: "141",
        produceType: "Plátanos",
        loadAccommodation: "Sideways / Atravezadas",
        spNumberOrder: "383323",
        entryTime: hoursAgo(5),
        forkliftAssigned: "Forklift 2",
        dockAssigned: "Dock 3",
        palletCount: 24,
        checkOutTime: hoursAgo(3),
        status: CHECKIN_STATUS.CHECKED_OUT,
      },
      {
        date: minutesAgo(40),
        createdAt: minutesAgo(40),
        driverName: "Carlos Ruiz",
        truckOrCompanyName: "Falca",
        trailerPlates: "DR-77213",
        driversLicense: "CHH-119023",
        phoneNumber: "614 208 9911",
        loadingType: "Loading / Cargar",
        unitNumber: "69",
        produceType: "Papaya",
        loadAccommodation: "Square / En Cuadro",
        status: CHECKIN_STATUS.OPEN,
      },
      {
        date: hoursAgo(8),
        createdAt: hoursAgo(8),
        driverName: "Luis Hernández",
        truckOrCompanyName: "Falca",
        trailerPlates: "382907",
        driversLicense: "CHH-550214",
        phoneNumber: "614 555 3320",
        loadingType: "Unloading / Descargar",
        unitNumber: "707",
        produceType: "Pepinos",
        loadAccommodation: "Straight / Derechas",
        entryTime: hoursAgo(8),
        forkliftAssigned: "Forklift 1",
        dockAssigned: "Dock 1",
        palletCount: 18,
        checkOutTime: hoursAgo(6),
        status: CHECKIN_STATUS.CHECKED_OUT,
      },
      {
        date: minutesAgo(20),
        createdAt: minutesAgo(20),
        driverName: "Pedro Sánchez",
        truckOrCompanyName: "Nicho Transport",
        trailerPlates: "NCH-30294",
        driversLicense: "SON-882317",
        phoneNumber: "662 447 1290",
        loadingType: "Loading / Cargar",
        unitNumber: "4",
        produceType: "Limas",
        loadAccommodation: serializeMultiSelect([
          "Single Double / Sencilla Doble",
          "Square / En Cuadro",
        ]),
        status: CHECKIN_STATUS.OPEN,
      },
      {
        date: hoursAgo(24),
        createdAt: hoursAgo(24),
        driverName: "Ana Torres",
        truckOrCompanyName: "Heb",
        trailerPlates: "HEB-11284",
        driversLicense: "TX-661820",
        phoneNumber: "915 208 4471",
        loadingType: "Unloading / Descargar",
        unitNumber: "2",
        produceType: "Otro",
        produceTypeOther: "Mangos",
        loadAccommodation: "Sideways / Atravezadas",
        entryTime: hoursAgo(24),
        forkliftAssigned: "Forklift 3",
        dockAssigned: "Dock 2",
        palletCount: 30,
        checkOutTime: hoursAgo(22),
        status: CHECKIN_STATUS.CHECKED_OUT,
      },
      {
        date: minutesAgo(10),
        createdAt: minutesAgo(10),
        driverName: "Jorge Ramírez",
        truckOrCompanyName: "Priority Transportation",
        trailerPlates: "PRT-56732",
        driversLicense: "CHH-990112",
        phoneNumber: "656 771 2093",
        loadingType: "Loading / Cargar",
        unitNumber: "5",
        produceType: "Aguacates",
        loadAccommodation: "Straight / Derechas",
        status: CHECKIN_STATUS.OPEN,
      },
      {
        date: hoursAgo(3),
        createdAt: hoursAgo(3),
        driverName: "Sofía Díaz",
        truckOrCompanyName: "Emto Transport",
        trailerPlates: "EMT-44029",
        driversLicense: "SON-224187",
        phoneNumber: "662 990 3341",
        loadingType: "Unloading / Descargar",
        unitNumber: "141",
        produceType: "Papaya",
        loadAccommodation: "Square / En Cuadro",
        entryTime: hoursAgo(3),
        forkliftAssigned: "Forklift 2",
        dockAssigned: "Dock 4",
        palletCount: 12,
        checkOutTime: hoursAgo(2),
        status: CHECKIN_STATUS.CHECKED_OUT,
      },
      {
        date: minutesAgo(5),
        createdAt: minutesAgo(5),
        driverName: "Miguel Ángel Cruz",
        truckOrCompanyName: "APR",
        trailerPlates: "APR-88213",
        driversLicense: "CHH-337702",
        phoneNumber: "656 118 2247",
        loadingType: "Loading / Cargar",
        unitNumber: "9",
        produceType: "Plátanos",
        loadAccommodation: "Straight / Derechas",
        spNumberOrder: "383479",
        spNumberOrder2: "383480",
        status: CHECKIN_STATUS.OPEN,
      },
    ],
  });

  const count = await prisma.checkIn.count();
  console.log(`Seed listo: ${count} registros de check-in creados.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
