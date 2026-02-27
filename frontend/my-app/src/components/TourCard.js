import "./TourCard.css";

export default function TourCard({
  title,
  description,
  imageSrc,
  imageAlt = "Tour preview",
  left,
  right,
  className = "",
}) {
  const cardClassName = `tourCard ${className}`.trim();

  return (
    <section className={cardClassName}>
      <div className="tourLeft">
        {left || (
          <>
            <h2 className="tourName">{title}</h2>
            {description ? <p className="tourDesc">{description}</p> : null}
          </>
        )}
      </div>

      <div className="tourRight">
        {right ||
          (imageSrc ? (
            <img className="tourImage" src={imageSrc} alt={imageAlt} />
          ) : (
            <div className="tourPlaceholder">Image or Map Here</div>
          ))}
      </div>
    </section>
  );
}

