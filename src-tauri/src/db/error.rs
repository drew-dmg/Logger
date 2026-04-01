use std::{error::Error, fmt};

#[derive(Debug)]
pub enum DbError {
    Validation { message: String },
    DependencyUnavailable { message: String },
    Storage { message: String },
}

impl DbError {
    pub fn is_non_blocking(&self) -> bool {
        matches!(self, Self::DependencyUnavailable { .. })
    }
}

impl fmt::Display for DbError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Validation { message } => write!(f, "Validation error: {message}"),
            Self::DependencyUnavailable { message } => {
                write!(f, "Dependency unavailable: {message}")
            }
            Self::Storage { message } => write!(f, "Storage error: {message}"),
        }
    }
}

impl Error for DbError {}

pub type DbResult<T> = Result<T, DbError>;
