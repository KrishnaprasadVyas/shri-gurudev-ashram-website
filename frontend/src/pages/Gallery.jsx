import SectionHeading from '../components/SectionHeading';
import GalleryGrid from '../components/GalleryGrid';
import { galleryImages } from '../data/dummyData';
import { brochureGalleryImages, brochureCategories } from '../data/brochureData';

const Gallery = () => {
  // GalleryGrid already renders a single 'All' button — pass only brochure categories
  const categories = brochureCategories;
  const images = brochureGalleryImages.length > 0 ? brochureGalleryImages : galleryImages;

  return (
    <>
      <section className="py-16 px-4 bg-amber-50">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-amber-900 mb-4">Gallery</h1>
          <p className="text-xl text-gray-700">Moments of devotion, service, and celebration</p>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            title="Photo Gallery"
            subtitle="Capturing beautiful moments from our ashram activities and events"
            center={true}
          />
          <GalleryGrid images={images} categories={categories} />
        </div>
      </section>
    </>
  );
};

export default Gallery;

