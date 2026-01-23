-- CreateEnum
CREATE TYPE "IngestionRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "Pokemon" (
    "dexId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "height" INTEGER,
    "weight" INTEGER,
    "baseExperience" INTEGER,
    "spriteDefault" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pokemon_pkey" PRIMARY KEY ("dexId")
);

-- CreateTable
CREATE TABLE "Type" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokemonType" (
    "pokemonDexId" INTEGER NOT NULL,
    "typeId" INTEGER NOT NULL,
    "slot" INTEGER NOT NULL,

    CONSTRAINT "PokemonType_pkey" PRIMARY KEY ("pokemonDexId","typeId")
);

-- CreateTable
CREATE TABLE "Stat" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Stat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokemonStat" (
    "pokemonDexId" INTEGER NOT NULL,
    "statId" INTEGER NOT NULL,
    "baseValue" INTEGER NOT NULL,
    "effort" INTEGER NOT NULL,

    CONSTRAINT "PokemonStat_pkey" PRIMARY KEY ("pokemonDexId","statId")
);

-- CreateTable
CREATE TABLE "Ability" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Ability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokemonAbility" (
    "pokemonDexId" INTEGER NOT NULL,
    "abilityId" INTEGER NOT NULL,
    "isHidden" BOOLEAN NOT NULL,
    "slot" INTEGER NOT NULL,

    CONSTRAINT "PokemonAbility_pkey" PRIMARY KEY ("pokemonDexId","abilityId")
);

-- CreateTable
CREATE TABLE "IngestionRun" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "rangeFrom" INTEGER,
    "rangeTo" INTEGER,
    "status" "IngestionRunStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "itemsTotal" INTEGER NOT NULL DEFAULT 0,
    "itemsSuccess" INTEGER NOT NULL DEFAULT 0,
    "itemsFailed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionError" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityKey" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestionError_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pokemon_name_key" ON "Pokemon"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Type_name_key" ON "Type"("name");

-- CreateIndex
CREATE INDEX "PokemonType_typeId_idx" ON "PokemonType"("typeId");

-- CreateIndex
CREATE UNIQUE INDEX "Stat_name_key" ON "Stat"("name");

-- CreateIndex
CREATE INDEX "PokemonStat_statId_idx" ON "PokemonStat"("statId");

-- CreateIndex
CREATE UNIQUE INDEX "Ability_name_key" ON "Ability"("name");

-- CreateIndex
CREATE INDEX "PokemonAbility_abilityId_idx" ON "PokemonAbility"("abilityId");

-- CreateIndex
CREATE INDEX "IngestionError_runId_idx" ON "IngestionError"("runId");

-- AddForeignKey
ALTER TABLE "PokemonType" ADD CONSTRAINT "PokemonType_pokemonDexId_fkey" FOREIGN KEY ("pokemonDexId") REFERENCES "Pokemon"("dexId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonType" ADD CONSTRAINT "PokemonType_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "Type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonStat" ADD CONSTRAINT "PokemonStat_pokemonDexId_fkey" FOREIGN KEY ("pokemonDexId") REFERENCES "Pokemon"("dexId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonStat" ADD CONSTRAINT "PokemonStat_statId_fkey" FOREIGN KEY ("statId") REFERENCES "Stat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonAbility" ADD CONSTRAINT "PokemonAbility_pokemonDexId_fkey" FOREIGN KEY ("pokemonDexId") REFERENCES "Pokemon"("dexId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonAbility" ADD CONSTRAINT "PokemonAbility_abilityId_fkey" FOREIGN KEY ("abilityId") REFERENCES "Ability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestionError" ADD CONSTRAINT "IngestionError_runId_fkey" FOREIGN KEY ("runId") REFERENCES "IngestionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
