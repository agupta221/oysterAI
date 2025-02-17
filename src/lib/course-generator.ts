import type { Syllabus, Section, Subsection, Topic } from "./openai";
import { fetchResourcesForTopic, type Resource } from "./perplexity";

interface TopicWithResources extends Topic {
  resources: Resource[];
}

interface SubsectionWithResources extends Subsection {
  topics: TopicWithResources[];
}

interface SectionWithResources extends Section {
  subsections: SubsectionWithResources[];
}

interface SyllabusWithResources extends Syllabus {
  sections: SectionWithResources[];
}

export async function enrichSyllabusWithResources(
  syllabus: Syllabus,
  userRequest: string
): Promise<SyllabusWithResources> {
  console.log("\n=== Starting Course Resource Generation ===");
  console.log("User Request:", userRequest);
  console.log(`Processing ${syllabus.sections.length} sections...`);

  // Process each section's subsections in parallel
  const enrichedSections = await Promise.all(
    syllabus.sections.map(async (section, sectionIndex) => {
      console.log(`\nProcessing Section ${sectionIndex + 1}/${syllabus.sections.length}: "${section.title}"`);
      
      const enrichedSubsections = await Promise.all(
        section.subsections.map(async (subsection, subsectionIndex) => {
          console.log(`\nProcessing Subsection ${subsectionIndex + 1}/${section.subsections.length}: "${subsection.title}"`);
          console.log(`Found ${subsection.topics.length} topics to process`);

          // Process all topics within a subsection in parallel
          const enrichedTopics = await Promise.all(
            subsection.topics.map(async (topic, topicIndex) => {
              console.log(`\nProcessing Topic ${topicIndex + 1}/${subsection.topics.length}: "${topic.title}"`);
              
              try {
                const resources = await fetchResourcesForTopic(
                  topic.title,
                  subsection.title,
                  userRequest
                );
                
                console.log(`Successfully enriched topic "${topic.title}" with ${resources.length} resources`);
                return {
                  ...topic,
                  resources,
                };
              } catch (error) {
                console.error(`Failed to fetch resources for topic "${topic.title}":`, error);
                return {
                  ...topic,
                  resources: [],
                };
              }
            })
          );

          console.log(`Completed processing all topics for subsection "${subsection.title}"`);
          return {
            ...subsection,
            topics: enrichedTopics,
          };
        })
      );

      console.log(`Completed processing all subsections for section "${section.title}"`);
      return {
        ...section,
        subsections: enrichedSubsections,
      };
    })
  );

  const enrichedSyllabus: SyllabusWithResources = {
    ...syllabus,
    sections: enrichedSections,
  };

  console.log("\n=== Course Resource Generation Summary ===");
  console.log("Total sections processed:", syllabus.sections.length);
  console.log("Total subsections processed:", syllabus.sections.reduce((acc, section) => acc + section.subsections.length, 0));
  console.log("Total topics processed:", syllabus.sections.reduce((acc, section) => 
    acc + section.subsections.reduce((subAcc, subsection) => subAcc + subsection.topics.length, 0), 0
  ));
  
  console.log("\nFinal Enriched Syllabus:");
  console.log(JSON.stringify(enrichedSyllabus, null, 2));
  console.log("\n=== End Course Resource Generation ===");

  return enrichedSyllabus;
} 