// Auto-generated brochure data: folders under public/assets/Brochure
export const brochureFolders = [
  {
    name: 'Adivasi',
    images: [
      '/assets/Brochure/Adivasi/0.JPG',
      '/assets/Brochure/Adivasi/00.JPG',
      '/assets/Brochure/Adivasi/1.JPG',
      '/assets/Brochure/Adivasi/10.JPG',
      '/assets/Brochure/Adivasi/11.JPG',
      '/assets/Brochure/Adivasi/12.JPG',
      '/assets/Brochure/Adivasi/2.jpg',
      '/assets/Brochure/Adivasi/3.jpg',
      '/assets/Brochure/Adivasi/4.JPG',
      '/assets/Brochure/Adivasi/5.JPG',
      '/assets/Brochure/Adivasi/6.JPG',
      '/assets/Brochure/Adivasi/7.JPG',
      '/assets/Brochure/Adivasi/8.JPG',
      '/assets/Brochure/Adivasi/9.JPG',
      '/assets/Brochure/Adivasi/IMG_1179.JPG',
      '/assets/Brochure/Adivasi/Medical Camp.jpg'
    ]
  },
  {
    name: 'Anath',
    images: [
      '/assets/Brochure/Anath/1.JPG',
      '/assets/Brochure/Anath/2.jpg',
      '/assets/Brochure/Anath/3.jpg',
      '/assets/Brochure/Anath/4.jpg'
    ]
  },
  {
    name: 'Annadan',
    images: [
      '/assets/Brochure/Annadan/1.JPG',
      '/assets/Brochure/Annadan/2.JPG',
      '/assets/Brochure/Annadan/3.JPG'
    ]
  },
  {
    name: 'Goushala',
    images: [
      '/assets/Brochure/Goushala/1.jpeg',
      '/assets/Brochure/Goushala/2.jpg',
      '/assets/Brochure/Goushala/3.jpg'
    ]
  },
  {
    name: 'Gurukul',
    images: [
      '/assets/Brochure/Gurukul/1.jpg',
      '/assets/Brochure/Gurukul/2.jpg',
      '/assets/Brochure/Gurukul/3.jpg'
    ]
  },
  {
    name: 'Seva Tirth',
    images: [
      '/assets/Brochure/Seva Tirth/01.jpg',
      '/assets/Brochure/Seva Tirth/1.JPG',
      '/assets/Brochure/Seva Tirth/2.jpg',
      '/assets/Brochure/Seva Tirth/IMG-20231027-WA0081.jpg'
    ]
  },
  {
    name: 'Shri Gurudev Vidhyalay',
    images: [
      '/assets/Brochure/Shri Gurudev Vidhyalay/1.jpg',
      '/assets/Brochure/Shri Gurudev Vidhyalay/2.jpg',
      '/assets/Brochure/Shri Gurudev Vidhyalay/3.jpg',
      '/assets/Brochure/Shri Gurudev Vidhyalay/4.jpg',
      '/assets/Brochure/Shri Gurudev Vidhyalay/5.jpg'
    ]
  },
  {
    name: 'Utsav',
    images: [
      '/assets/Brochure/Utsav/1.JPG',
      '/assets/Brochure/Utsav/2.JPG',
      '/assets/Brochure/Utsav/3.JPG',
      '/assets/Brochure/Utsav/4.JPG',
      '/assets/Brochure/Utsav/5.JPG',
      '/assets/Brochure/Utsav/6.JPG',
      '/assets/Brochure/Utsav/7.JPG'
    ]
  },
  {
    name: 'Vaishanvi Mata',
    images: [
      '/assets/Brochure/Vaishanvi Mata/Vaishanvi Temple_.png'
    ]
  }
];

// helper to flatten to gallery images
export const brochureGalleryImages = brochureFolders.flatMap((folder, idx) =>
  folder.images.map((src, i) => ({ id: `${idx}-${i}`, src, title: `${folder.name} - ${i+1}`, category: folder.name }))
);

export const brochureCategories = brochureFolders.map(f => f.name);

export default brochureFolders;
