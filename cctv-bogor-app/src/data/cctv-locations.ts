import { CCTVLocation } from '@/types'

export const cctvLocations: CCTVLocation[] = [
  {
    id: 'tugu-kujang',
    nama: 'Tugu Kujang',
    lat: -6.600791,
    lon: 106.805229,
    stream_url: 'https://restreamer2.kotabogor.go.id/memfs/5a5cf878-9d9b-4400-a73a-27a5b24a6ec4.m3u8',
    status: 'online',
    description: 'Landmark utama Kota Bogor, area wisata dan pusat aktivitas'
  },
  {
    id: 'depan-kantor-pos',
    nama: 'Depan Kantor Pos',
    lat: -6.600123,
    lon: 106.794764,
    stream_url: 'https://restreamer3.kotabogor.go.id/memfs/e2d12ced-bcc3-4826-b872-97fcce335e93.m3u8',
    status: 'online',
    description: 'Area depan Kantor Pos Besar Bogor, Jalan Ir. H. Juanda'
  },
  {
    id: 'jl-juanda-kapten-muslihat',
    nama: 'Jl. Juanda Arah Kapten Muslihat',
    lat: -6.598047,
    lon: 106.794007,
    stream_url: 'https://restreamer3.kotabogor.go.id/memfs/519d2368-103e-4e7c-860c-35d66a7f6352.m3u8',
    status: 'online',
    description: 'Jalan Juanda menuju arah Jalan Kapten Muslihat, persimpangan strategis'
  },
  {
    id: 'depan-balaikota',
    nama: 'Depan Balaikota Bogor',
    lat: -6.595156,
    lon: 106.794334,
    stream_url: 'https://restreamer3.kotabogor.go.id/memfs/e7d14e54-b9bd-474a-8976-dd08baec4498.m3u8',
    status: 'online',
    description: 'Area depan Balaikota Bogor, pusat pemerintahan Kota Bogor'
  },
  {
    id: 'jl-pajajaran',
    nama: 'Jalan Pajajaran',
    lat: -6.596026, 
    lon: 106.804409,
    stream_url: 'https://restreamer3.kotabogor.go.id/memfs/6542214a-fe60-4e0f-9330-79106c62ddcc.m3u8',
    status: 'online',
    description: 'Jalan Pajajaran, jalur utama penghubung utara Kota Bogor'
  },
]

export const bogorMapConfig = {
  center: [-6.5985, 106.797] as [number, number],
  zoom: 16,
  minZoom: 11,
  maxZoom: 18
}
