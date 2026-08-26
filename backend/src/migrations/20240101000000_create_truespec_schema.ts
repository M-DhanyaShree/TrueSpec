import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. laptops table
  await knex.schema.createTable('laptops', (table) => {
    table.increments('id').primary();
    table.string('brand', 100).notNullable().index();
    table.string('model_name', 255).notNullable();
    table.string('cpu_name', 255).notNullable();
    table.integer('cpu_score').notNullable();
    table.string('gpu_name', 255).notNullable();
    table.integer('gpu_score').notNullable();
    table.integer('ram_gb').notNullable();
    table.string('storage_type', 50).notNullable().defaultTo('SSD');
    table.integer('storage_gb').notNullable();
    table.float('display_size').notNullable();
    table.integer('refresh_rate').notNullable().defaultTo(60);
    table.float('battery_wh').notNullable();
    table.float('weight_kg').notNullable();
    table.decimal('price', 10, 2).notNullable().index();
    table.string('currency', 10).notNullable().defaultTo('USD');
    table.string('os', 100).notNullable();
    table.string('category', 100).notNullable().index();
    table.timestamps(true, true);
  });

  // 2. reviews table
  await knex.schema.createTable('reviews', (table) => {
    table.increments('id').primary();
    table.integer('laptop_id').unsigned().notNullable()
      .references('id').inTable('laptops').onDelete('CASCADE').index();
    table.string('source', 100).notNullable();
    table.text('review_text').notNullable();
    table.float('rating').notNullable();
    table.boolean('verified_purchase').notNullable().defaultTo(true);
    table.string('review_date', 50).nullable();
    table.boolean('is_flagged').notNullable().defaultTo(false).index();
    table.string('sentiment_label', 50).nullable().index();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 3. laptop_scores table
  await knex.schema.createTable('laptop_scores', (table) => {
    table.increments('id').primary();
    table.integer('laptop_id').unsigned().notNullable().unique()
      .references('id').inTable('laptops').onDelete('CASCADE');
    table.float('confidence_score').notNullable().index();
    table.float('wilson_lower_bound').notNullable();
    table.float('positive_ratio').notNullable();
    table.integer('review_count').notNullable();
    table.integer('clean_review_count').notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('laptop_scores');
  await knex.schema.dropTableIfExists('reviews');
  await knex.schema.dropTableIfExists('laptops');
}
