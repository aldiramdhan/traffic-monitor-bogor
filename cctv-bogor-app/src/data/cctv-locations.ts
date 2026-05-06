import { CCTVLocation } from '@/types'

export const cctvLocations: CCTVLocation[] = [
  {
    id: 'tugu-kujang',
    nama: 'Tugu Kujang',
    lat: -6.600791,
    lon: 106.805229,
    stream_url: 'https://restreamer.kotabogor.go.id/memfs/aedb3f80-3355-411f-a8fa-08320766c07a.m3u8',
    status: 'online',
    description: 'Landmark utama Kota Bogor, area wisata dan pusat aktivitas'
  },
  {
    id: 'depan-kantor-pos',
    nama: 'Depan Kantor Pos',
    lat: -6.600123,
    lon: 106.794764,
    stream_url: 'https://restreamer.kotabogor.go.id/memfs/7f86312d-fc35-4700-9bd1-2a624b13d111.m3u8',
    status: 'online',
    description: 'Area depan Kantor Pos Besar Bogor, Jalan Ir. H. Juanda'
  },
  {
    id: 'jl-juanda-kapten-muslihat',
    nama: 'Jl. Juanda Arah Kapten Muslihat',
    lat: -6.598047,
    lon: 106.794007,
    stream_url: 'https://restreamer2.kotabogor.go.id/memfs/3ec6eaf2-4da1-4adb-8c15-0251e69121d6.m3u8',
    status: 'online',
    description: 'Jalan Juanda menuju arah Jalan Kapten Muslihat, persimpangan strategis'
  },
  {
    id: 'depan-balaikota',
    nama: 'Depan Balaikota Bogor',
    lat: -6.595156,
    lon: 106.794334,
    stream_url: 'https://restreamer.kotabogor.go.id/memfs/fe1d07cb-9634-4364-bd1c-6846cbce67ef.m3u8',
    status: 'online',
    description: 'Area depan Balaikota Bogor, pusat pemerintahan Kota Bogor'
  },
  {
    id: 'jl-pajajaran',
    nama: 'Jalan Pajajaran',
    lat: -6.592915,
    lon: 106.802377,
    stream_url: 'https://restreamer.kotabogor.go.id/memfs/c048edf7-bce5-4bd2-8329-668ee45734b8.m3u8',
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
