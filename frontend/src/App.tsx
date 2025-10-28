import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import axios from "axios"
// @ts-expect-error - react-responsive-masonry doesn't have types
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry"
import {
  Upload,
  Search,
  X,
  Image as ImageIcon,
  FileText,
  Loader2,
  Trash2,
  ZoomIn,
  Edit,
  Save,
  AlertCircle,
  RefreshCw
} from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

interface ImageResult {
  id: string
  image: string
  text: string
  confidence?: string
  matched?: boolean
  createdAt?: string
}

interface UploadPreview {
  file: File
  preview: string
  id: string
}

export default function App() {
  const [selectedFiles, setSelectedFiles] = useState<UploadPreview[]>([])
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [images, setImages] = useState<ImageResult[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState("")
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load all images on initial page load
  useEffect(() => {
    fetchImages()
  }, [])

  // Debounced search - hit API on every search
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set searching state immediately when user types
    if (searchQuery) {
      setSearching(true)
    }

    // Debounce API call
    debounceTimerRef.current = setTimeout(() => {
      fetchImages(searchQuery)
    }, 300) // Wait 300ms after user stops typing

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery])

  // Fetch images from database with optional search
  const fetchImages = async (search?: string) => {
    // Don't show main loading spinner when searching
    if (!search) {
      setLoading(true)
    } else {
      setSearching(true)
    }

    try {
      const params = search ? { search } : {}
      const response = await axios.get(`${API_BASE_URL}/image`, { params })

      setImages(response.data.results || [])
      setTotalCount(response.data.count || 0)

      console.log(`Fetched ${response.data.count} images${search ? ` for search: "${search}"` : ''}`)
    } catch (error) {
      console.error("Failed to fetch images:", error)
      setImages([])
      setTotalCount(0)
    } finally {
      setLoading(false)
      setSearching(false)
    }
  }

  // Handle file selection
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newFiles = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9),
    }))

    setSelectedFiles((prev) => [...prev, ...newFiles])
  }

  // Remove file from preview
  const removeFile = (id: string) => {
    setSelectedFiles((prev) => {
      const file = prev.find((f) => f.id === id)
      if (file) URL.revokeObjectURL(file.preview)
      return prev.filter((f) => f.id !== id)
    })
  }

  // Upload files
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one image")
      return
    }

    setUploading(true)
    const formData = new FormData()
    selectedFiles.forEach((item) => {
      formData.append("images", item.file)
    })

    try {
      const response = await axios.post(`${API_BASE_URL}/image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      toast.success(`${response.data.results.length} images uploaded and processed!`)

      // Clear selected files
      selectedFiles.forEach((item) => URL.revokeObjectURL(item.preview))
      setSelectedFiles([])

      // Close modal and refresh images
      setUploadModalOpen(false)
      setSearchQuery("") // Clear search
      fetchImages()
    } catch (error) {
      console.error("Upload failed:", error)
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || "Upload failed"
          : "Upload failed"
      )
    } finally {
      setUploading(false)
    }
  }

  // Update image text
  const handleUpdateImage = async () => {
    if (!selectedImage || !editedText.trim()) {
      toast.error("Text cannot be empty")
      return
    }

    setUpdating(true)
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/image/${selectedImage.id}`,
        { text: editedText }
      )

      toast.success("Image text updated successfully!")

      // Update the image in the local state
      setImages((prev) =>
        prev.map((img) =>
          img.id === selectedImage.id
            ? { ...img, text: editedText }
            : img
        )
      )

      // Update selected image
      setSelectedImage({ ...selectedImage, text: editedText })
      setIsEditing(false)

      console.log("Updated:", response.data)
    } catch (error) {
      console.error("Update failed:", error)
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || "Failed to update image"
          : "Failed to update image"
      )
    } finally {
      setUpdating(false)
    }
  }

  // Delete image
  const handleDeleteImage = async () => {
    if (!selectedImage) return

    setDeleting(true)
    try {
      await axios.delete(`${API_BASE_URL}/image/${selectedImage.id}`)

      toast.success("Image deleted successfully!")

      // Remove image from local state
      setImages((prev) => prev.filter((img) => img.id !== selectedImage.id))
      setTotalCount((prev) => prev - 1)

      // Close modal
      setSelectedImage(null)
      setIsEditing(false)

      console.log("Deleted:", selectedImage.image)
    } catch (error) {
      console.error("Delete failed:", error)
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || "Failed to delete image"
          : "Failed to delete image"
      )
    } finally {
      setDeleting(false)
    }
  }

  // Start editing
  const handleStartEdit = () => {
    if (selectedImage) {
      setEditedText(selectedImage.text)
      setIsEditing(true)
    }
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedText("")
  }

  // Regenerate text (re-run OCR)
  const handleRegenerateText = async () => {
    if (!selectedImage) return

    setRegenerating(true)
    try {
      const response = await axios.post(
        `${API_BASE_URL}/image/${selectedImage.id}/regenerate`
      )

      const newText = response.data.result.text
      const newConfidence = response.data.result.confidence

      toast.success("Text regenerated successfully!")

      // Update the image in the local state
      setImages((prev) =>
        prev.map((img) =>
          img.id === selectedImage.id
            ? { ...img, text: newText, confidence: newConfidence }
            : img
        )
      )

      // Update selected image
      setSelectedImage({
        ...selectedImage,
        text: newText,
        confidence: newConfidence
      })

      console.log("Regenerated:", response.data)
    } catch (error) {
      console.error("Regenerate failed:", error)
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || "Failed to regenerate text"
          : "Failed to regenerate text"
      )
    } finally {
      setRegenerating(false)
    }
  }

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    handleFileSelect(files)
  }, [])

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <ImageIcon className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">OCR Image Gallery</h1>
                <p className="text-sm text-muted-foreground">
                  Upload images and search text within them
                </p>
              </div>
            </div>

            {/* Upload Button - Top Right */}
            <Button
              onClick={() => setUploadModalOpen(true)}
              size="lg"
              className="gap-2"
            >
              <Upload className="w-5 h-5" />
              Upload Images
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Search Section */}
        <Card className="overflow-hidden border-border/50 shadow-md">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Search Images by Text</h2>
              </div>

              <div className="flex gap-2 relative">
                <div className="relative flex-1">
                  <Input
                    placeholder="Type to search text in images..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 pr-10"
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                {searchQuery && (
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery("")}
                    size="lg"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>
                    {searchQuery ? (
                      <>
                        Found <strong className="text-foreground">{totalCount}</strong> result{totalCount !== 1 ? 's' : ''} for "{searchQuery}"
                      </>
                    ) : (
                      <>
                        Total <strong className="text-foreground">{totalCount}</strong> image{totalCount !== 1 ? 's' : ''}
                      </>
                    )}
                  </span>
                </div>
                {searching && (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching...</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading images...</p>
            </div>
          </div>
        )}

        {/* Results Section */}
        {!loading && images.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">
              {searchQuery ? "Search Results" : "All Images"}
            </h2>

            <ResponsiveMasonry
              columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3, 1200: 4 }}
            >
              <Masonry gutter="1rem">
                {images.map((result) => (
                  <Card
                    key={result.id}
                    className="overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 group cursor-pointer"
                    onClick={() => setSelectedImage(result)}
                  >
                    <div className="relative">
                      <img
                        src={`${API_BASE_URL}/images/${result.image}`}
                        alt={result.image}
                        className="w-full h-auto object-cover"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback for broken images
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn className="w-8 h-8 text-white" />
                      </div>
                      {result.confidence && (
                        <Badge className="absolute top-2 right-2">
                          {result.confidence}% confidence
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground truncate">
                          {result.image}
                        </p>
                        <div className="relative">
                          <p className="text-xs text-foreground line-clamp-4 bg-muted p-3 rounded-md font-mono">
                            {result.text}
                          </p>
                          {result.text.length > 150 && (
                            <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-muted to-transparent" />
                          )}
                        </div>
                        {result.createdAt && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(result.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </Masonry>
            </ResponsiveMasonry>
          </div>
        )}

        {/* Empty State */}
        {!loading && !searching && images.length === 0 && (
          <Card className="border-dashed border-2 border-border/50">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-muted rounded-full">
                  {searchQuery ? (
                    <Search className="w-8 h-8 text-muted-foreground" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    {searchQuery ? "No Results Found" : "No Images Yet"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "Try searching with different keywords"
                      : "Upload some images to get started"}
                  </p>
                </div>
                {!searchQuery && (
                  <Button onClick={() => setUploadModalOpen(true)} size="lg">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Your First Images
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Images</DialogTitle>
            <DialogDescription>
              Upload up to 10 images for OCR text extraction
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Drop Zone */}
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                transition-all duration-200 ease-in-out
                ${isDragging
                  ? "border-primary bg-primary/10 scale-[1.02]"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-3">
                <div className={`p-4 rounded-full ${isDragging ? 'bg-primary/20' : 'bg-muted'}`}>
                  <Upload className={`w-8 h-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="text-lg font-medium">
                    {isDragging ? "Drop files here" : "Drag & drop images here"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse (up to 10 images)
                  </p>
                </div>
              </div>
            </div>

            {/* File Previews */}
            {selectedFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Selected Files ({selectedFiles.length})
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      selectedFiles.forEach((item) => URL.revokeObjectURL(item.preview))
                      setSelectedFiles([])
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {selectedFiles.map((item) => (
                    <div key={item.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                        <img
                          src={item.preview}
                          alt={item.file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(item.id)
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-destructive text-primary-foreground rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {item.file.name}
                      </p>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full"
                  size="lg"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload & Process {selectedFiles.length} {selectedFiles.length === 1 ? 'Image' : 'Images'}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Detail Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => {
            setSelectedImage(null)
            setIsEditing(false)
            setEditedText("")
          }}
        >
          <div
            className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-background border-b border-border p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold truncate flex-1">{selectedImage.image}</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedImage(null)
                    setIsEditing(false)
                    setEditedText("")
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {!isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateText}
                      disabled={regenerating || deleting}
                      className="gap-2"
                    >
                      {regenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Regenerate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartEdit}
                      disabled={regenerating || deleting}
                      className="gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteImage}
                      disabled={deleting || regenerating}
                      className="gap-2"
                    >
                      {deleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Delete
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={updating}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleUpdateImage}
                      disabled={updating}
                      className="gap-2"
                    >
                      {updating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="p-4 space-y-4">
              <img
                src={`${API_BASE_URL}/images/${selectedImage.image}`}
                alt={selectedImage.image}
                className="w-full rounded-lg"
              />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Extracted Text:</h4>
                  {isEditing && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="w-4 h-4" />
                      <span>Editing mode</span>
                    </div>
                  )}
                  {regenerating && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Re-running OCR...</span>
                    </div>
                  )}
                </div>
                {isEditing ? (
                  <Textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                    placeholder="Enter extracted text..."
                  />
                ) : (
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                    {selectedImage.text}
                  </div>
                )}
              </div>
              {selectedImage.confidence && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    Confidence: {selectedImage.confidence}%
                  </Badge>
                </div>
              )}
              {selectedImage.createdAt && (
                <div className="text-sm text-muted-foreground">
                  Uploaded: {new Date(selectedImage.createdAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
