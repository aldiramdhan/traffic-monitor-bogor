"""
Seed 24 CCTV locations into PostgreSQL.
Idempotent: uses INSERT ... ON CONFLICT DO NOTHING.
Called automatically on FastAPI startup if the table is empty.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from app.models.db_models import CCTVPoint
from app.config import settings

# (id, nama, lat, lon, stream_url, status, description, seq, thresh_low, thresh_high)
_SEED_DATA = [
    ("btm-juanda",          "Simpang BTM Arah Juanda",                       -6.604264, 106.796570, "https://restreamer.kotabogor.go.id/memfs/7f86312d-fc35-4700-9bd1-2a624b13d111.m3u8",  "online", "Persimpangan BTM menuju arah Juanda, area komersial yang ramai",   1,  8, 20),
    ("tugu-kujang",         "Tugu Kujang",                                   -6.601312, 106.805363, "https://restreamer.kotabogor.go.id/memfs/aedb3f80-3355-411f-a8fa-08320766c07a.m3u8",  "online", "Landmark utama Kota Bogor, area wisata dan pusat aktivitas",         2, 10, 25),
    ("jembatan-otista",     "Jembatan Otista",                               -6.601881, 106.803268, "https://restreamer.kotabogor.go.id/memfs/1dd9dac0-e6db-40b6-ae39-59717fdeeeb7.m3u8",  "online", "Jembatan strategis di Jalan Otista, penghubung utama kota",          3, 10, 25),
    ("depan-alun-alun",     "Simpang Kapten Muslihat-Djuanda",               -6.596225, 106.791093, "https://restreamer2.kotabogor.go.id/memfs/3ec6eaf2-4da1-4adb-8c15-0251e69121d6.m3u8", "online", "Simpang kapten Muslihat menuju arah Djuanda",                        4,  8, 20),
    ("arah-ciheuleut",      "Arah Ciheuleut",                                -6.607753, 106.809851, "https://restreamer.kotabogor.go.id/memfs/e167c204-5ff8-4f58-ad24-50f4fd2ef004.m3u8",  "online", "Jalur menuju Ciheuleut, area perumahan dan pendidikan",              5, 10, 25),
    ("lawang-gintung",      "Simpang Tiga Lawang Gintung",                   -6.619962, 106.814478, "https://restreamer.kotabogor.go.id/memfs/8be48917-2090-4de7-aa35-7c01d28e16be.m3u8",  "online", "Persimpangan tiga menuju Lawang Gintung, area perumahan",            6,  8, 20),
    ("masjid-raya",         "Depan Masjid Raya",                             -6.606982, 106.809107, "https://restreamer.kotabogor.go.id/memfs/0da67044-cfaa-4ba1-be9a-795fc0c23ea1.m3u8",  "online", "Area depan Masjid Raya Bogor, pusat keagamaan kota",                 7, 10, 25),
    ("gang-aut",            "Gang Aut",                                      -6.605546, 106.800369, "https://restreamer.kotabogor.go.id/memfs/b7e99f5a-85a1-48be-b06f-65904cd5fa7e.m3u8",  "online", "Area Gang Aut, jalur alternatif dalam kota",                         8,  5, 12),
    ("dishub-ciawi",        "Depan Dishub ke arah Ciawi",                    -6.629362, 106.824026, "https://restreamer.kotabogor.go.id/memfs/1a250cb5-3fb7-41c8-962d-5a3fe2540ae8.m3u8",  "online", "Area Dishub menuju Ciawi, jalur keluar kota",                        9, 15, 35),
    ("pancasan-empang",     "Simpang Tiga Pancasan Arah Jalan Empang Pasir Kuda", -6.607058, 106.791719, "https://restreamer.kotabogor.go.id/memfs/6515d5ea-e7b3-4824-b123-f8c9ebec562e.m3u8", "online", "Persimpangan Pancasan menuju Empang, area perumahan",            10,  8, 20),
    ("empang-bnr",          "Simpang Empang arah BNR",                       -6.607742, 106.795125, "https://restreamer.kotabogor.go.id/memfs/9257bf6b-389c-424d-8eff-771add34d205.m3u8",  "online", "Persimpangan Empang menuju BNR, jalur strategis",                   11, 10, 25),
    ("empang-pancasan",     "Simpang Empang arah Pancasan",                  -6.607723, 106.795001, "https://restreamer.kotabogor.go.id/memfs/7cf529b4-19f1-4af5-ba43-fe6f370360b7.m3u8",  "online", "Persimpangan Empang menuju Pancasan, area residensial",              12, 10, 25),
    ("bundaran-ekalokasari","Bundaran Ekalokasari",                          -6.621153, 106.816292, "https://restreamer.kotabogor.go.id/memfs/cfb39fd8-855b-4253-80e3-f25c6e3f5b75.m3u8",  "online", "Bundaran utama Ekalokasari, simpul lalu lintas penting",             13,  8, 20),
    ("arah-surya-kencana",  "Arah Surya Kencana",                            -6.604239, 106.799412, "https://restreamer.kotabogor.go.id/memfs/3b117452-5d6e-4291-9500-0ac9294532f4.m3u8",  "online", "Jalur menuju Surya Kencana, area komersial",                         14, 10, 25),
    ("pedati-lawang-gintung","Pedati Arah Lawang Gintung",                   -6.604000, 106.799291, "https://restreamer.kotabogor.go.id/memfs/8ca5344d-e8a4-4d31-89e1-08a90fd946bf.m3u8",  "online", "Jalan Pedati menuju Lawang Gintung",                                 15,  5, 12),
    ("surken-lawang-seketeng","Surken Arah Lawang Seketeng",                 -6.604020, 106.798726, "https://restreamer.kotabogor.go.id/memfs/6d054ad5-615c-4102-959c-cbb3052f60fc.m3u8",  "online", "Surya Kencana menuju Lawang Seketeng",                               16,  5, 12),
    ("pedati-surya-kencana","Pedati Arah Surya Kencana",                     -6.604597, 106.798990, "https://restreamer.kotabogor.go.id/memfs/01ef5275-d900-495d-af21-16b8dbdf5527.m3u8",  "online", "Jalan Pedati menuju Surya Kencana",                                  17,  5, 12),
    ("simpang-denpom",      "Simpang Denpom",                                -6.593143, 106.797045, "https://restreamer.kotabogor.go.id/memfs/35336564-5b50-489b-a746-5e2ab3a5d023.m3u8",  "online", "Persimpangan area Denpom, jalur militer",                            18, 10, 25),
    ("simpang-rs-salak",    "Simpang RS Salak",                              -6.591861, 106.797203, "https://restreamer.kotabogor.go.id/memfs/e24f5b08-0783-417c-ac7c-9d92f546abe9.m3u8",  "online", "Persimpangan RS Salak, area kesehatan",                              19, 10, 25),
    ("jalan-surya-kencana", "Jalan Surya Kencana",                           -6.605511, 106.800327, "https://restreamer.kotabogor.go.id/memfs/c6700d06-4fc7-4814-9569-84238dd80064.m3u8",  "online", "Jalan Surya Kencana, pusat wisata kuliner",                          20, 10, 25),
    ("jalan-sukasari",      "Jalan Sukasari",                                -6.618312, 106.814777, "https://restreamer.kotabogor.go.id/memfs/a9090a08-fac4-4c24-9cf3-8ab9a116e93f.m3u8",  "online", "Jalan Sukasari, area perumahan",                                     21, 10, 25),
    ("jalan-jalak-harupat", "Jalan Jalak Harupat",                           -6.592707, 106.801952, "https://restreamer.kotabogor.go.id/memfs/c048edf7-bce5-4bd2-8329-668ee45734b8.m3u8",  "online", "Jalan Jalak Harupat, area residensial",                              22, 10, 25),
    ("alun-alun-bri",       "Alun-alun depan BRI",                           -6.595164, 106.791844, "https://restreamer.kotabogor.go.id/memfs/fe1d07cb-9634-4364-bd1c-6846cbce67ef.m3u8",  "online", "Area Alun-alun depan Bank BRI",                                      23,  8, 20),
    ("alun-alun-shelter",   "Alun-alun Shelter",                             -6.593952, 106.792105, "https://restreamer.kotabogor.go.id/memfs/c99660a9-dcf0-4478-82a3-1fbe56d64a18.m3u8",  "online", "Area shelter Alun-alun, tempat istirahat pengunjung",                24,  8, 20),
]


async def seed_if_empty(session: AsyncSession) -> None:
    count = await session.scalar(select(func.count()).select_from(CCTVPoint))
    if count and count > 0:
        return

    for (id_, nama, lat, lon, stream_url, status, desc, seq, low, high) in _SEED_DATA:
        await session.execute(
            text("""
                INSERT INTO cctv_points
                    (id, nama, lat, lon, stream_url, status, description, sequence_order, threshold_low, threshold_high)
                VALUES
                    (:id, :nama, :lat, :lon, :stream_url, :status, :desc, :seq, :low, :high)
                ON CONFLICT (id) DO NOTHING
            """),
            dict(id=id_, nama=nama, lat=lat, lon=lon, stream_url=stream_url,
                 status=status, desc=desc, seq=seq, low=low, high=high),
        )
    await session.commit()
