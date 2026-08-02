import { useEffect } from "react";
import SectionHeading from "../components/SectionHeading";
import GalleryGrid from "../components/GalleryGrid";
import { useGallery } from "../context/GalleryContext";

const Gallery = () => {
  const { getVisibleItems, getCategories, fetchVisibleGallery } = useGallery();

  // Trigger the public gallery fetch explicitly when this page mounts or the
  // language changes. Previously this was auto-fired inside GalleryContext on
  // every mount (including the admin pages), which caused admin-fetched
  // galleryCategories to be overwritten. Now it runs only for the public page.
  useEffect(() => {
    fetchVisibleGallery();
  }, [fetchVisibleGallery]);

  const images = getVisibleItems();
  const categories = getCategories();

  return (
    <>
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
