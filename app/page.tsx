export default function Home() {
  // Redirect to external waitlist page
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.location.href = "https://www.anyquant.co.uk/waitlist";`,
      }}
    />
  )
}
