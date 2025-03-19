import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/blogCard.css';

const BlogCard = ({ id, title, date, readLength, image, summary }) => {
  return (
    <Link to={`/blog/${id}`} className="blog-card-link">
      <div className="blog-card">
        {image && (
          <div className="blog-card-image">
            <img src={image} alt={title} />
          </div>
        )}
        <div className="blog-card-content">
          <h3 className="blog-card-title">{title}</h3>
          <div className="blog-card-meta" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <p className="blog-card-date">{date}</p>
            <p className="blog-card-readLength">{readLength}</p>
          </div>
          <p className="blog-card-summary">{summary}</p>
        </div>
      </div>
    </Link>
  );
};

export default BlogCard;
