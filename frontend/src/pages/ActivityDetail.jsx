import { useParams, Link, useNavigate } from "react-router-dom";
import SectionHeading from "../components/SectionHeading";
import { activities } from "../data/dummyData";

const ActivityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const activity = activities.find((a) => String(a.id) === String(id));
  

  if (!activity) {
    return (
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Activity not found</h2>
          <p className="mb-6">The activity you're looking for does not exist.</p>
          <Link to="/activities" className="px-4 py-2 bg-amber-600 text-white rounded">
            Back to Activities
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="py-12 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <SectionHeading title={activity.title} subtitle={activity.description} center={true} />
          </div>

          {/* no hero image per request (no photos) */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(activity.subitems || []).map((sub) => (
              <div key={sub.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-amber-100 p-5">
                <h3 className="text-lg font-semibold text-amber-900 mb-2">{sub.title}</h3>
                <p className="text-gray-700 mb-3">{sub.description}</p>
                {sub.points && (
                  <ul className="list-disc list-inside text-gray-700">
                    {sub.points.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex gap-3">
            <button onClick={() => navigate(-1)} className="px-4 py-2 bg-amber-600 text-white rounded">
              Back
            </button>
            <Link to="/contact" className="px-4 py-2 bg-white border border-amber-600 text-amber-600 rounded">
              Join / Contact
            </Link>
          </div>
        </div>
      </section>

      {/* photos removed per request */}
    </>
  );
};

export default ActivityDetail;
