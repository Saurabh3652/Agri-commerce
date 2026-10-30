// Fills an empty database with starter data.
//   npm run seed            -> only creates documents that don't exist yet (safe: keeps your edits)
//   npm run seed -- --reset -> overwrites existing documents with the starter data
import bcrypt from "bcryptjs";
import type { Model } from "mongoose";
import { logger } from "../../common/logger";
import { env } from "../../config/env";
import { OtpModel } from "../../modules/auth/models/otp.model";
import { SessionModel } from "../../modules/auth/models/session.model";
import { CustomerModel } from "../../modules/customer/customer.model";
import { CategoryModel } from "../../modules/category/category.model";
import { NavigationModel } from "../../modules/content/models/navigation.model";
import { PageModel } from "../../modules/content/models/page.model";
import { SiteSettingsModel } from "../../modules/content/models/site-settings.model";
import { OrderModel, CounterModel } from "../../modules/order/order.model";
import { ProductModel } from "../../modules/product/product.model";
import { DeliveryAreaModel, StoreConfigModel } from "../../modules/store/store.model";
import { storeRepository } from "../../modules/store/store.repository";
import { connectDatabase, disconnectDatabase } from "../connection";
import { categories, products } from "./data/catalog.data";
import { navigations, pages, siteSettings } from "./data/content.data";
import { deliveryAreas } from "./data/store.data";

const reset = process.argv.includes("--reset");
const counts = { created: 0, updated: 0, skipped: 0 };

/** Creates the document if missing; overwrites it only with --reset. Uses save() so model hooks/validation run. */
async function upsert(model: Model<any>, filter: Record<string, unknown>, data: Record<string, unknown>) {
  const existing = await model.findOne(filter);
  if (existing && !reset) {
    counts.skipped++;
    return existing;
  }
  const doc = existing ?? new model();
  doc.set(data);
  await doc.save();
  counts[existing ? "updated" : "created"]++;
  return doc;
}

async function seedCatalog() {
  const categoryIds = new Map<string, unknown>();
  for (const c of categories) {
    const doc = await upsert(CategoryModel, { slug: c.slug }, c);
    categoryIds.set(c.slug, doc._id);
  }

  for (const p of products) {
    const { category, variants, ...rest } = p;
    await upsert(
      ProductModel,
      { slug: p.slug },
      {
        ...rest,
        categoryId: categoryIds.get(category),
        variants: variants.map(({ price, mrp, ...v }) => ({ ...v, pricePaise: price * 100, mrpPaise: mrp * 100 })),
      },
    );
  }
}

async function seedContent() {
  await upsert(SiteSettingsModel, { locale: siteSettings.locale }, siteSettings);
  for (const nav of navigations) {
    await upsert(NavigationModel, { key: nav.key, locale: nav.locale }, nav);
  }
  for (const page of pages) {
    await upsert(PageModel, { slug: page.slug, locale: page.locale }, page);
  }
}

/**
 * Creates the first admin. Admins are never created through a public route, so this script
 * is the only way one comes into existence.
 */
async function seedAdmin() {
  if (!env.ADMIN_PHONE || !env.ADMIN_PASSWORD) {
    logger.warn("ADMIN_PHONE / ADMIN_PASSWORD not set — skipping admin account");
    return;
  }
  const existing = await CustomerModel.findOne({ phone: env.ADMIN_PHONE });
  if (existing && !reset) {
    counts.skipped++;
    return;
  }
  const doc = existing ?? new CustomerModel();
  doc.set({
    phone: env.ADMIN_PHONE,
    firstName: "Admin",
    role: "ADMIN",
    passwordHash: await bcrypt.hash(env.ADMIN_PASSWORD, 12), // cost 12: slow on purpose
  });
  await doc.save();
  counts[existing ? "updated" : "created"]++;
  logger.info(`Admin account ready for ${env.ADMIN_PHONE}`);
}

async function seedStore() {
  await storeRepository.getConfig(); // creates the config from its schema defaults if missing
  for (const { pincode, fee, ...area } of deliveryAreas) {
    await upsert(DeliveryAreaModel, { _id: pincode }, { _id: pincode, ...area, deliveryFeePaise: fee * 100 });
  }
}

async function main() {
  await connectDatabase();
  await Promise.all(
    [
      CategoryModel,
      ProductModel,
      SiteSettingsModel,
      NavigationModel,
      PageModel,
      CustomerModel,
      OtpModel,
      SessionModel,
      OrderModel,
      CounterModel,
      StoreConfigModel,
      DeliveryAreaModel,
    ].map(
      (m) => m.syncIndexes(),
    ),
  );
  await seedCatalog();
  await seedContent();
  await seedStore();
  await seedAdmin();
  logger.info(counts, reset ? "Seed finished (reset mode)" : "Seed finished");
}

main()
  .catch((err) => {
    logger.error({ err }, "Seed failed");
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());
