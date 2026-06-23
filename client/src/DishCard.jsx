export default function DishCard({ dish, onToggle, onSimulate }) {
  return (
    <div className="card">
      <div className="card-img-wrapper">
        <img src={dish.imageUrl} alt={dish.dishName} />
      </div>
      <div className="card-body">
        <h3>{dish.dishName}</h3>
        <span className={`badge ${dish.isPublished ? 'green' : 'red'}`}>
          <span className="badge-dot" />
          {dish.isPublished ? 'Active' : 'Disabled'}
        </span>
        <div className="actions">
          <button className={`btn-toggle ${!dish.isPublished ? 'enable' : ''}`} onClick={onToggle}>
            {dish.isPublished ? 'Disable' : 'Enable'}
          </button>
          <button className="btn-sim" onClick={onSimulate}>Simulate DB Change</button>
        </div>
      </div>
    </div>
  );
}
