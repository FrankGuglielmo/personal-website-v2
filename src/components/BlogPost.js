import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { BlogData } from '../data/blogData';
import NavBar from './NavBar';
import Footer from './Footer';
import '../styles/blogCard.css';

const BlogPost = () => {
  const { postId } = useParams();
  const post = BlogData.find((p) => p.id.toString() === postId);

  // If post is not found, redirect to blog page
  if (!post) {
    return <Link to="/blog" />;
  }

  // Function to render HTML content safely
  const createMarkup = (htmlContent) => {
    return { __html: htmlContent };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Background header */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 h-32 w-full absolute top-0 z-0"></div>
      
      {/* Navigation */}
      <NavBar />
      
      <div className="container mx-auto relative z-10 pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Back button */}
          <div className="p-6 pb-0">
            <Link to="/blog" className="blog-back-button">
              ← Back to Blog
            </Link>
          </div>
          
          {/* Featured image if available */}
          {post.image && (
            <div className="w-full h-80 overflow-hidden">
              <img 
                src={post.image} 
                alt={post.title} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Post content */}
          <article className="blog-post">
            <header className="blog-post-header">
              <h1 className="blog-post-title">{post.title}</h1>
              <p className="blog-post-date">{post.date}</p>
            </header>
            
            <div 
              className="blog-post-content"
              dangerouslySetInnerHTML={createMarkup(post.content)}
            />
            
            {/* Display media content */}
            {post.media && post.media.length > 0 && (
              <div className="blog-post-media mt-8">
                {post.media.map((item, index) => (
                  <div key={index} className="my-4">
                    {item.type === 'image' && (
                      <img 
                        src={item.src} 
                        alt={item.alt} 
                        className="max-w-full rounded-lg"
                      />
                    )}
                    {item.type === 'video' && (
                      <div className="aspect-w-16 aspect-h-9">
                        <iframe
                          src={item.src}
                          title={item.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full rounded-lg"
                        ></iframe>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default BlogPost;
