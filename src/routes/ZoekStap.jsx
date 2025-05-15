import React from "react";
import { useNavigate } from "react-router-dom";
import SearchForm from "../components/SearchForm";

export default function ZoekStap({ onSearch }) {
  const navigate = useNavigate();

  const handleSearchAndNavigate = async (formData) => {
    await onSearch(formData);   
    navigate("/kaart");           
  };

  return (
    <div className="search-container">
      <SearchForm onSearch={handleSearchAndNavigate} />
    </div>
  );
}
