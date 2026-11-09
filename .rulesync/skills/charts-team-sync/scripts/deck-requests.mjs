#!/usr/bin/env node
/**
 * Turns a Charts Team Sync deck spec into Google Slides `update_presentation` request batches.
 * See ../SKILL.md for the spec format.
 *
 * Usage: node deck-requests.mjs <spec.json> <out-dir>
 * Writes batch-1.json, batch-2.json, ... and reports each batch's size. Warnings go to stderr.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Batches above this size have been slow to send through the connector.
const MAX_BATCH_CHARS = 30000;

// Agenda geometry, in EMU. The left column is wider because the longest labels tend to fall there.
const COLUMNS = [
    [311700, 4760000],
    [4880000, 8832300],
];
const AVATAR = 340000;
const BADGE_WIDTH = 580000;
const BADGE_HEIGHT = 260000;
const ROWS_TOP = 1270000;
const ROWS_BOTTOM = 4840000;
const MAX_PITCH = 510000;
const LABEL_HEIGHT = 400000;
const TEXT_BOX_INSETS = 182880;
const AVERAGE_CHAR_EMU = 88000; // 14pt Arial, from measuring the longest labels.

// The master's header band, and that colour at 25% over white.
const BAND = { red: 25 / 255, green: 68 / 255, blue: 141 / 255 };
const BAND_TINT = { red: 0.7745, green: 0.8167, blue: 0.8882 };
const WHITE = { red: 1, green: 1, blue: 1 };

const pt = (magnitude) => ({ magnitude, unit: 'PT' });
const emu = (magnitude) => ({ magnitude, unit: 'EMU' });
const fixedRange = (startIndex, endIndex) => ({ type: 'FIXED_RANGE', startIndex, endIndex });
const ALL = { type: 'ALL' };

const elementProperties = (pageObjectId, x, y, width, height) => ({
    pageObjectId,
    size: { width: emu(width), height: emu(height) },
    transform: { scaleX: 1, scaleY: 1, translateX: x, translateY: y, unit: 'EMU' },
});

const indent = (objectId, textRange, start, first) => ({
    updateParagraphStyle: {
        objectId,
        textRange,
        style: { indentStart: pt(start), indentFirstLine: pt(first) },
        fields: 'indentStart,indentFirstLine',
    },
});

const fontSize = (objectId, textRange, size) => ({
    updateTextStyle: { objectId, textRange, style: { fontSize: pt(size) }, fields: 'fontSize' },
});

const rightAlignTitle = (objectId) => ({
    updateParagraphStyle: { objectId, textRange: ALL, style: { alignment: 'END' }, fields: 'alignment' },
});

function createSlide(objectId, insertionIndex, layoutId, placeholders) {
    const placeholderIdMappings = placeholders.map(([type, id]) => ({
        layoutPlaceholder: { type, index: 0 },
        objectId: id,
    }));
    return { createSlide: { objectId, insertionIndex, slideLayoutReference: { layoutId }, placeholderIdMappings } };
}

/**
 * Bullets are created after the text is in place. `createParagraphBullets` consumes the leading tabs that set each
 * paragraph's level, so every index after it is calculated from the text without those tabs.
 */
function bodyRequests(objectId, paragraphs, size) {
    if (paragraphs.length === 0) return [];

    const text = paragraphs.map((p) => '\t'.repeat(p.level ?? 0) + p.text).join('\n');
    const requests = [{ insertText: { objectId, text } }];

    const firstBullet = paragraphs.findIndex((p) => !p.heading);
    const bulletStart = paragraphs.slice(0, firstBullet).reduce((sum, p) => sum + p.text.length + 1, 0);
    if (firstBullet > 0) {
        requests.push({ deleteParagraphBullets: { objectId, textRange: fixedRange(0, bulletStart) } });
    }
    requests.push(
        {
            createParagraphBullets: {
                objectId,
                textRange: fixedRange(bulletStart, text.length),
                bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE',
            },
        },
        fontSize(objectId, ALL, size),
        indent(objectId, ALL, 36, 11)
    );

    let position = 0;
    let nestedStart;
    for (const paragraph of [...paragraphs, undefined]) {
        const nested = paragraph?.level === 1;
        if (nested && nestedStart === undefined) nestedStart = position;
        if (!nested && nestedStart !== undefined) {
            requests.push(indent(objectId, fixedRange(nestedStart, position), 72, 47));
            nestedStart = undefined;
        }
        if (paragraph === undefined) break;

        const end = position + paragraph.text.length;
        if (paragraph.heading) {
            requests.push(
                indent(objectId, fixedRange(position, end + 1), 0, 0),
                fontSize(objectId, fixedRange(position, end), size + 3)
            );
        }
        if (paragraph.url) {
            requests.push({
                updateTextStyle: {
                    objectId,
                    textRange: fixedRange(position, end),
                    style: { link: { url: paragraph.url } },
                    fields: 'link',
                },
            });
        }
        position = end + 1;
    }
    return requests;
}

function agendaRowRequests(slideId, rowId, { presenter, avatarUrl, label, version }, solidVersion, x0, x1, y) {
    const avatar = `${rowId}_av`;
    const text = `${rowId}_tx`;
    const badge = `${rowId}_bd`;
    const labelWidth = x1 - x0 - AVATAR - BADGE_WIDTH;

    if (label.length * AVERAGE_CHAR_EMU + TEXT_BOX_INSETS > labelWidth) {
        console.warn(`Agenda label may wrap, check the render: ${label}`);
    }

    const requests = [
        {
            createImage: {
                objectId: avatar,
                url: avatarUrl,
                elementProperties: elementProperties(slideId, x0, y, AVATAR, AVATAR),
            },
        },
        { updatePageElementAltText: { objectId: avatar, title: presenter, description: `${presenter} (presenter)` } },
        {
            createShape: {
                objectId: text,
                shapeType: 'TEXT_BOX',
                elementProperties: elementProperties(
                    slideId,
                    x0 + AVATAR,
                    y + (AVATAR - LABEL_HEIGHT) / 2,
                    labelWidth,
                    LABEL_HEIGHT
                ),
            },
        },
        { insertText: { objectId: text, text: label } },
        {
            updateTextStyle: {
                objectId: text,
                textRange: ALL,
                style: { fontSize: pt(14), foregroundColor: { opaqueColor: { themeColor: 'DARK2' } } },
                fields: 'fontSize,foregroundColor',
            },
        },
        {
            updateShapeProperties: {
                objectId: text,
                shapeProperties: { contentAlignment: 'MIDDLE' },
                fields: 'contentAlignment',
            },
        },
    ];

    if (version) {
        const solid = version === solidVersion;
        requests.push(
            {
                createShape: {
                    objectId: badge,
                    shapeType: 'ROUND_RECTANGLE',
                    elementProperties: elementProperties(
                        slideId,
                        x1 - BADGE_WIDTH,
                        y + (AVATAR - BADGE_HEIGHT) / 2,
                        BADGE_WIDTH,
                        BADGE_HEIGHT
                    ),
                },
            },
            {
                updateShapeProperties: {
                    objectId: badge,
                    shapeProperties: {
                        shapeBackgroundFill: { solidFill: { color: { rgbColor: solid ? BAND : BAND_TINT } } },
                        outline: { propertyState: 'NOT_RENDERED' },
                        contentAlignment: 'MIDDLE',
                    },
                    fields: 'shapeBackgroundFill.solidFill.color,outline.propertyState,contentAlignment',
                },
            },
            { insertText: { objectId: badge, text: version } },
            {
                updateTextStyle: {
                    objectId: badge,
                    textRange: ALL,
                    style: {
                        bold: true,
                        fontSize: pt(10),
                        foregroundColor: { opaqueColor: { rgbColor: solid ? WHITE : BAND } },
                    },
                    fields: 'bold,fontSize,foregroundColor',
                },
            },
            {
                updateParagraphStyle: {
                    objectId: badge,
                    textRange: ALL,
                    style: { alignment: 'CENTER' },
                    fields: 'alignment',
                },
            }
        );
    }
    return requests;
}

function agendaRequests(slideId, items) {
    const newestFirst = [...new Set(items.map((item) => item.version).filter(Boolean))].sort((a, b) =>
        b.localeCompare(a, undefined, { numeric: true })
    );
    const rows = Math.ceil(items.length / 2);
    const pitch = Math.min(MAX_PITCH, Math.floor((ROWS_BOTTOM - ROWS_TOP - AVATAR) / Math.max(rows - 1, 1)));
    if (pitch < AVATAR) console.warn(`Agenda has ${items.length} items, too many for ${rows} rows of avatars.`);

    return items.flatMap((item, index) => {
        const [x0, x1] = COLUMNS[index < rows ? 0 : 1];
        const y = ROWS_TOP + (index % rows) * pitch;
        const rowId = `${slideId}_r${String(index).padStart(2, '0')}`;
        return agendaRowRequests(slideId, rowId, item, newestFirst[0], x0, x1, y);
    });
}

function main([specPath, outDir]) {
    if (!specPath || !outDir) {
        console.error('Usage: node deck-requests.mjs <spec.json> <out-dir>');
        process.exit(1);
    }
    const { id, layouts, deleteSlideIds, subtitle, agenda, slides } = JSON.parse(readFileSync(specPath, 'utf8'));
    const page = (n) => `${id}_s${String(n).padStart(2, '0')}`;

    const titleSlide = page(1);
    const agendaSlide = page(2);
    const contentSlides = slides.map((slide, index) => ({ ...slide, id: page(index + 3) }));

    const structure = [
        createSlide(titleSlide, 0, layouts.title, [
            ['CENTERED_TITLE', `${titleSlide}_t`],
            ['SUBTITLE', `${titleSlide}_b`],
        ]),
        createSlide(agendaSlide, 1, layouts.body, [
            ['TITLE', `${agendaSlide}_t`],
            ['BODY', `${agendaSlide}_b`],
        ]),
        ...contentSlides.map((slide, index) =>
            createSlide(slide.id, index + 2, layouts.body, [
                ['TITLE', `${slide.id}_t`],
                ['BODY', `${slide.id}_b`],
            ])
        ),
        ...deleteSlideIds.map((objectId) => ({ deleteObject: { objectId } })),
        { insertText: { objectId: `${titleSlide}_t`, text: 'Charts Team Sync' } },
        { insertText: { objectId: `${titleSlide}_b`, text: subtitle } },
        { insertText: { objectId: `${agendaSlide}_t`, text: 'Agenda' } },
        rightAlignTitle(`${agendaSlide}_t`),
        { deleteObject: { objectId: `${agendaSlide}_b` } },
    ];

    const groups = [
        structure,
        ...agendaRequests(agendaSlide, agenda).reduce((rows, request) => {
            // Start a new group at each avatar, so a batch never splits an agenda row.
            if (request.createImage) rows.push([]);
            rows[rows.length - 1].push(request);
            return rows;
        }, []),
        ...contentSlides.map((slide) => [
            { insertText: { objectId: `${slide.id}_t`, text: slide.title } },
            rightAlignTitle(`${slide.id}_t`),
            ...bodyRequests(`${slide.id}_b`, slide.paragraphs, slide.size ?? 16),
        ]),
    ];

    const batches = [[]];
    for (const group of groups) {
        const current = batches[batches.length - 1];
        const size = JSON.stringify([...current, ...group]).length;
        if (current.length > 0 && size > MAX_BATCH_CHARS) batches.push([...group]);
        else current.push(...group);
    }

    mkdirSync(outDir, { recursive: true });
    batches.forEach((batch, index) => {
        const json = JSON.stringify(batch);
        writeFileSync(join(outDir, `batch-${index + 1}.json`), json);
        console.log(`batch-${index + 1}.json: ${batch.length} requests, ${json.length} characters`);
    });
}

main(process.argv.slice(2));
